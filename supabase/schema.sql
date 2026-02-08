-- =====================================================
-- FLIGHT FINDER DATABASE SCHEMA
-- =====================================================
-- This schema stores user preferences, flight search results,
-- and alert configurations for the flight monitoring system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
-- Stores each user's travel preferences including:
-- - Which days they want to travel (e.g., Friday-Sunday)
-- - Destination cities/countries
-- - Budget limits
-- - Home airport
-- =====================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE, -- Clerk user ID
  
  -- Travel timing preferences
  travel_days TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['friday', 'saturday', 'sunday']
  flexible_dates BOOLEAN DEFAULT true, -- Can travel any week or specific dates only
  months_ahead INTEGER DEFAULT 3, -- How many months in advance to search
  
  -- Origin airport
  origin_airport TEXT NOT NULL, -- IATA code e.g., 'AMS', 'LHR'
  origin_city TEXT NOT NULL, -- Human readable e.g., 'Amsterdam'
  
  -- Destinations (stored as JSONB for flexibility)
  -- Structure: [{ city: 'Barcelona', country: 'Spain', code: 'BCN' }, ...]
  destinations JSONB NOT NULL DEFAULT '[]',
  
  -- Budget constraints
  max_price_one_way INTEGER, -- In cents (e.g., 3000 = €30)
  max_price_round_trip INTEGER, -- In cents (e.g., 6000 = €60)
  preferred_currency TEXT DEFAULT 'EUR',
  
  -- Alert settings
  alert_enabled BOOLEAN DEFAULT true,
  alert_email TEXT NOT NULL,
  alert_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'instant'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- FLIGHT SEARCHES TABLE
-- =====================================================
-- Stores generated search URLs and parameters
-- Each row represents one specific search we need to perform
-- e.g., "Amsterdam to Barcelona, Friday Dec 13 to Sunday Dec 15"
-- =====================================================
CREATE TABLE flight_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Clerk user ID
  preference_id UUID REFERENCES user_preferences(id) ON DELETE CASCADE,
  
  -- Search parameters
  origin TEXT NOT NULL, -- IATA code
  destination TEXT NOT NULL, -- IATA code
  destination_city TEXT NOT NULL, -- Human readable
  outbound_date DATE NOT NULL,
  return_date DATE, -- NULL for one-way
  
  -- Search URLs for different platforms
  google_flights_url TEXT,
  skyscanner_url TEXT,
  
  -- Search status
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  last_checked_at TIMESTAMP WITH TIME ZONE,
  next_check_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_flight_searches_user_id ON flight_searches(user_id);
CREATE INDEX idx_flight_searches_status ON flight_searches(status);
CREATE INDEX idx_flight_searches_next_check ON flight_searches(next_check_at);
CREATE INDEX idx_flight_searches_dates ON flight_searches(outbound_date, return_date);

-- =====================================================
-- FLIGHT RESULTS TABLE
-- =====================================================
-- Stores actual flight prices found from searches
-- Multiple results per search (one from each platform)
-- =====================================================
CREATE TABLE flight_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES flight_searches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Flight details
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  outbound_date DATE NOT NULL,
  return_date DATE,
  
  -- Price information
  price_cents INTEGER NOT NULL, -- Price in cents
  currency TEXT DEFAULT 'EUR',
  platform TEXT NOT NULL, -- 'google', 'skyscanner', etc.
  
  -- Booking details
  booking_url TEXT NOT NULL, -- Direct link to book this flight
  airline TEXT, -- If available
  stops INTEGER, -- 0 = direct, 1 = 1 stop, etc.
  
  -- Price tracking
  is_deal BOOLEAN DEFAULT false, -- True if below user's budget threshold
  price_change_since_last INTEGER, -- In cents, positive = increase
  
  -- Metadata
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_flight_results_search_id ON flight_results(search_id);
CREATE INDEX idx_flight_results_user_id ON flight_results(user_id);
CREATE INDEX idx_flight_results_is_deal ON flight_results(is_deal);
CREATE INDEX idx_flight_results_price ON flight_results(price_cents);
CREATE INDEX idx_flight_results_dates ON flight_results(outbound_date, return_date);

-- =====================================================
-- ALERT HISTORY TABLE
-- =====================================================
-- Tracks which alerts have been sent to avoid duplicates
-- =====================================================
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  result_id UUID REFERENCES flight_results(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL, -- 'price_drop', 'new_deal', 'reminder'
  sent_to_email TEXT NOT NULL,
  
  -- Email content reference
  subject TEXT,
  flight_details JSONB, -- Snapshot of flight info when alert sent
  
  -- Status
  sent_successfully BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Metadata
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for checking if alert already sent
CREATE INDEX idx_alert_history_user_result ON alert_history(user_id, result_id);
CREATE INDEX idx_alert_history_sent_at ON alert_history(sent_at);

-- =====================================================
-- PRICE HISTORY TABLE
-- =====================================================
-- Stores historical price data for trend analysis
-- Optional but useful for showing price charts
-- =====================================================
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES flight_searches(id) ON DELETE CASCADE,
  
  -- Price snapshot
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  platform TEXT NOT NULL,
  
  -- Additional context
  availability TEXT, -- 'available', 'sold_out', 'limited'
  
  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX idx_price_history_search_recorded ON price_history(search_id, recorded_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Ensures users can only see their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Flight searches policies
CREATE POLICY "Users can view own searches"
  ON flight_searches FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own searches"
  ON flight_searches FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Flight results policies
CREATE POLICY "Users can view own results"
  ON flight_results FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Alert history policies
CREATE POLICY "Users can view own alerts"
  ON alert_history FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Service role can do anything (for background workers)
-- This will be used by our Puppeteer script running with service role key

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================
-- Uncomment to insert test data

/*
INSERT INTO user_preferences (
  user_id,
  travel_days,
  origin_airport,
  origin_city,
  destinations,
  max_price_round_trip,
  alert_email
) VALUES (
  'user_test123',
  ARRAY['friday', 'saturday', 'sunday'],
  'AMS',
  'Amsterdam',
  '[
    {"city": "Barcelona", "country": "Spain", "code": "BCN"},
    {"city": "Lisbon", "country": "Portugal", "code": "LIS"},
    {"city": "Rome", "country": "Italy", "code": "FCO"}
  ]'::jsonb,
  6000,
  'user@example.com'
);
*/
