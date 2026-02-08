
import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase';
import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServerClient();
    
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!preferences) {
      return NextResponse.json({ error: 'No preferences set' }, { status: 400 });
    }
    
    // Generate searches if they don't exist
    const { data: existingSearches } = await supabase
      .from('flight_searches')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (!existingSearches || existingSearches.length === 0) {
      await generateSearches(userId, preferences, supabase);
    }
    
    // Trigger background job to check prices
    // For now, we'll return success and check in background
    // In production, you'd use a queue system
    
    return NextResponse.json({ 
      success: true,
      message: 'Flight search started. Results will appear shortly.'
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

async function generateSearches(userId, preferences, supabase) {
  const { generateTripCombinations } = await import('../../../lib/date-utils');
  const { getAllSearchUrls } = await import('../../../lib/flight-urls');
  
  const dateCombinations = generateTripCombinations(
    preferences.travel_days.slice(0, 1),
    preferences.travel_days.slice(-1),
    preferences.months_ahead
  );
  
  const searches = [];
  
  for (const destination of preferences.destinations) {
    for (const dates of dateCombinations.slice(0, 20)) {
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
        status: 'pending',
        next_check_at: new Date().toISOString(),
      });
    }
  }
  
  await supabase.from('flight_searches').delete().eq('user_id', userId);
  
  if (searches.length > 0) {
    await supabase.from('flight_searches').insert(searches);
  }
}