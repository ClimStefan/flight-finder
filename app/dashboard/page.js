import { redirect } from 'next/navigation';
import { createServerClient } from '../../lib/supabase';
import Link from 'next/link';
import FlightResults from '../../components/FlightResults';
import SearchFlightsButton from '../../components/SearchFlightsButton';
import GetUserIdClient from '../../components/GetUserIdClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
// =====================================================
// Fetch user's preferences from database
// =====================================================
async function getUserPreferences(userId) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching preferences:', error);
    return null;
  }
  
  return data;
}

// =====================================================
// Fetch recent flight results for user
// =====================================================
async function getRecentFlights(userId, maxBudget) {
  const supabase = createServerClient();
  
  let query = supabase
    .from('flight_results')
    .select(`
      *,
      flight_searches (
        destination_city,
        outbound_date,
        return_date
      )
    `)
    .eq('user_id', userId);
  
  // Only filter by budget if it's defined
  if (maxBudget) {
    query = query.lte('price_cents', maxBudget);
  }
  
  const { data, error } = await query
    .order('price_cents', { ascending: true })
    .limit(50);
  
  if (error) {
    console.error('Error fetching flights:', error);
    return [];
  }
  
  return data || [];
}

// =====================================================
// Main Dashboard Component
// =====================================================
export default async function DashboardPage({ searchParams }) {
  // Get userId from URL parameter (passed from client)
  const userId = searchParams?.userId;
  
  if (!userId) {
    // Show a client component that will get the ID and reload
    return <GetUserIdClient />;
  }
  
  // Fetch user data
   const preferences = await getUserPreferences(userId);
  
  // Only fetch flights if preferences exist and have a budget
  let flights = [];
  if (preferences && preferences.max_price_round_trip) {
    flights = await getRecentFlights(userId, preferences.max_price_round_trip);
  }
  // If no preferences set, show onboarding
  if (!preferences) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-6">✈️</div>
        
        <h1 className="text-3xl font-bold mb-4">Welcome to Flight Finder!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Let's set up your travel preferences so we can start finding you amazing deals.
        </p>
       <Link 
          href={`/dashboard/preferences?userId=${userId}`}
          className="btn-primary text-lg px-8 py-3 inline-block"
        >
          Set Up Preferences
        </Link>
        
      </div>
    );
  }
  
  // Parse destinations from JSONB
  const destinations = preferences.destinations || [];
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Flight Deals</h1>
          <p className="text-gray-600">
            Showing flights from {preferences.origin_city} to {destinations.length} destinations
          </p>
        </div>
        <Link 
          href="/dashboard/preferences" 
          className="btn-secondary"
        >
          Edit Preferences
        </Link>
      </div>
      
      {/* Preferences Summary Card */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Your Search Criteria</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500 mb-1">Travel Days</div>
            <div className="font-medium capitalize">
              {preferences.travel_days?.join(', ') || 'Not set'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Destinations</div>
            <div className="font-medium">
              {destinations.length} cities
              <div className="text-xs text-gray-600 mt-1">
                {destinations.slice(0, 3).map(d => d.city).join(', ')}
                {destinations.length > 3 && ` +${destinations.length - 3} more`}
              </div>
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Max Budget</div>
            <div className="font-medium">
              €{(preferences.max_price_round_trip / 100).toFixed(0)} round-trip
            </div>
          </div>
        </div>
      </div>

{/* Search Flights Button */}
      <SearchFlightsButton />
      
      {/* Flight Results */}
      {flights.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">No flights found yet</h3>
          <p className="text-gray-600 mb-6">
            We haven't run our first search yet. This usually happens within 24 hours of setting up your preferences.
          </p>
          <p className="text-sm text-gray-500">
            You'll receive an email alert when we find flights matching your criteria.
          </p>
        </div>
      ) : (
        <FlightResults flights={flights} maxBudget={preferences.max_price_round_trip} />
      )}
      
      {/* Info Box */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div className="flex gap-3">
          <div className="text-2xl"></div>
          <div>
            <h3 className="font-semibold text-primary-900 mb-1">How This Works</h3>
            <p className="text-primary-800 text-sm">
              We automatically search for flights matching your preferences daily. 
              When we find a deal under €{(preferences.max_price_round_trip / 100).toFixed(0)}, 
              you'll get an email alert. Click any result below to book directly on the platform.
            </p>
          </div>
        </div>
      </div>
      <Link 
  href="/waitlist" 
  className="btn-secondary bg-green text-lg px-8 py-3 inline-block"
>
  Join Waitlist
</Link>
    </div>
  );
}