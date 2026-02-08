// =====================================================
// API ROUTE: Save User Preferences
// =====================================================
// This endpoint handles saving or updating user travel preferences
// POST /api/preferences
// =====================================================


import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase';

export async function POST(request) {
  try {
    // Get userId from request body (no auth needed)
    const body = await request.json();
    const userId = body.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
       
    // Validate required fields
    if (!body.originAirport || !body.originCity) {
      return NextResponse.json(
        { error: 'Origin airport is required' },
        { status: 400 }
      );
    }
    
    if (!body.travelDays || body.travelDays.length === 0) {
      return NextResponse.json(
        { error: 'At least one travel day is required' },
        { status: 400 }
      );
    }
    
    if (!body.destinations || body.destinations.length === 0) {
      return NextResponse.json(
        { error: 'At least one destination is required' },
        { status: 400 }
      );
    }
    
    if (!body.alertEmail) {
      return NextResponse.json(
        { error: 'Email is required for alerts' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Prepare data for database
    const preferencesData = {
      user_id: userId,
      travel_days: body.travelDays,
      flexible_dates: body.flexibleDates,
      months_ahead: body.monthsAhead,
      origin_airport: body.originAirport,
      origin_city: body.originCity,
      destinations: body.destinations, // JSONB field
      max_price_round_trip: body.maxPriceRoundTrip, // Already in cents from frontend
      preferred_currency: 'EUR',
      alert_enabled: body.alertEnabled,
      alert_email: body.alertEmail,
      alert_frequency: 'daily', // Default to daily
    };
    
    // Check if user already has preferences
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    let result;
    
    if (existing) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert(preferencesData)
        .select()
        .single();
    }

    await generateFlightSearches(userId, result.data);
    
    if (result.error) {
      console.error('Supabase error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
    });
    
  } catch (error) {
    console.error('Error in preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// Helper: Generate flight searches based on preferences
// =====================================================
// This creates flight_searches records for all combinations
// of dates and destinations based on user preferences
async function generateFlightSearches(userId, preferences) {
  try {
    const supabase = createServerClient();
    
    // Import our date utility functions
    const { generateTripCombinations } = await import('../../../lib/date-utils');
    const { getAllSearchUrls } = await import('../../../lib/flight-urls');
    
    // Generate all date combinations based on travel days
    // For now, we'll use a simple approach: find all instances of selected days
    // in the next X months
    const dateCombinations = generateTripCombinations(
      preferences.travel_days.slice(0, 1), // First selected day as outbound
      preferences.travel_days.slice(-1), // Last selected day as return
      preferences.months_ahead
    );
    
    // Create a search for each destination and date combination
    const searches = [];
    
    for (const destination of preferences.destinations) {
      for (const dates of dateCombinations.slice(0, 20)) { // Limit to first 20 date combinations
        const urls = getAllSearchUrls(
          preferences.origin_airport,
          destination.code,
          dates.outbound,
          dates.return
        );
        
       searches.push({
          user_id: userId,
          preference_id: preferences.id,
          origin: preferences.origin_airport,
          destination: destination.code,
          destination_city: destination.city,
          outbound_date: dates.outbound.toISOString().split('T')[0],
          return_date: dates.return ? dates.return.toISOString().split('T')[0] : null,
          google_flights_url: urls.google,
          skyscanner_url: urls.skyscanner,
          kayak_url: urls.kayak,
          status: 'pending',
          next_check_at: new Date().toISOString(),
        });
      }
    }
    
    // Delete existing searches for this user (fresh start)
    await supabase
      .from('flight_searches')
      .delete()
      .eq('user_id', userId);
    
    // Insert new searches
    if (searches.length > 0) {
      const { error } = await supabase
        .from('flight_searches')
        .insert(searches);
      
      if (error) {
        console.error('Error inserting flight searches:', error);
      } else {
        console.log(`Generated ${searches.length} flight searches for user ${userId}`);
      }
    }
    
  } catch (error) {
    console.error('Error generating flight searches:', error);
  }
}
