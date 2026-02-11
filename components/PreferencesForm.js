// =====================================================
// PREFERENCES FORM COMPONENT (CLIENT-SIDE)
// =====================================================
// This form allows users to configure their flight search preferences:
// 1. Home airport selection
// 2. Travel days (which days they prefer to fly)
// 3. Destination cities
// 4. Budget constraints
// 5. Alert settings
// =====================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Popular European airports (expandable)
const POPULAR_AIRPORTS = [
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'LHR', city: 'London', country: 'United Kingdom' },
  { code: 'CDG', city: 'Paris', country: 'France' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany' },
  { code: 'MAD', city: 'Madrid', country: 'Spain' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain' },
  { code: 'FCO', city: 'Rome', country: 'Italy' },
  { code: 'MXP', city: 'Milan', country: 'Italy' },
  { code: 'BRU', city: 'Brussels', country: 'Belgium' },
  { code: 'VIE', city: 'Vienna', country: 'Austria' },
  { code: 'SBZ', city: 'Sibiu', country: 'Romania' },
  { code: 'CLJ', city: 'Cluj-Napoca', country: 'Romania' },
  { code: 'TSR', city: 'Timișoara', country: 'Romania' },
  { code: 'TGM', city: 'Târgu Mureș', country: 'Romania' },
  { code: 'OTP', city: 'Bucharest', country: 'Romania' },
];

// Popular destination cities
const POPULAR_DESTINATIONS = [
  { code: 'BCN', city: 'Barcelona', country: 'Spain' },
  { code: 'MAD', city: 'Madrid', country: 'Spain' },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal' },
  { code: 'OPO', city: 'Porto', country: 'Portugal' },
  { code: 'FCO', city: 'Rome', country: 'Italy' },
  { code: 'MXP', city: 'Milan', country: 'Italy' },
  { code: 'NAP', city: 'Naples', country: 'Italy' },
  { code: 'ATH', city: 'Athens', country: 'Greece' },
  { code: 'PRG', city: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', city: 'Budapest', country: 'Hungary' },
  { code: 'VIE', city: 'Vienna', country: 'Austria' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark' },
  { code: 'STO', city: 'Stockholm', country: 'Sweden' },
  { code: 'DUB', city: 'Dublin', country: 'Ireland' },
  { code: 'EDI', city: 'Edinburgh', country: 'Scotland' },
];

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export default function PreferencesForm({ userId, initialData }) {
   console.log('PreferencesForm userId:', userId);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    originAirport: initialData?.origin_airport || '',
    originCity: initialData?.origin_city || '',
    travelDays: initialData?.travel_days || [],
    flexibleDates: initialData?.flexible_dates ?? true,
    monthsAhead: initialData?.months_ahead || 3,
    destinations: initialData?.destinations || [],
    maxPriceRoundTrip: initialData?.max_price_round_trip ? initialData.max_price_round_trip / 100 : 60,
    alertEnabled: initialData?.alert_enabled ?? true,
    alertEmail: initialData?.alert_email || '',
  });
  
  // =====================================================
  // Handle form field changes
  // =====================================================
  const handleOriginChange = (e) => {
    const airport = POPULAR_AIRPORTS.find(a => a.code === e.target.value);
    if (airport) {
      setFormData({
        ...formData,
        originAirport: airport.code,
        originCity: airport.city,
      });
    }
  };
  
  const handleDayToggle = (day) => {
    const newDays = formData.travelDays.includes(day)
      ? formData.travelDays.filter(d => d !== day)
      : [...formData.travelDays, day];
    
    setFormData({ ...formData, travelDays: newDays });
  };
  
  const handleDestinationToggle = (destination) => {
    const exists = formData.destinations.find(d => d.code === destination.code);
    const newDestinations = exists
      ? formData.destinations.filter(d => d.code !== destination.code)
      : [...formData.destinations, destination];
    
    setFormData({ ...formData, destinations: newDestinations });
  };
  
  // =====================================================
  // Form submission
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validation
      if (!formData.originAirport) {
        throw new Error('Please select your home airport');
      }
      if (formData.travelDays.length === 0) {
        throw new Error('Please select at least one travel day');
      }
      if (formData.destinations.length === 0) {
        throw new Error('Please select at least one destination');
      }
      if (!formData.alertEmail) {
        throw new Error('Please enter your email for alerts');
      }
      
      // Submit to API
         const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId, // Add this line
          ...formData,
          maxPriceRoundTrip: Math.round(formData.maxPriceRoundTrip * 100),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save preferences');
      }
      
     setSuccess('Preferences saved successfully!');
      
      // Wait a moment for user to see success message, then redirect
      setTimeout(() => {
        window.location.href = `/dashboard?userId=${userId}`;
      }, 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {/* Origin Airport */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Home Airport</h2>
        <div>
          <label className="label">Where will you fly from?</label>
          <select
            value={formData.originAirport}
            onChange={handleOriginChange}
            className="input-field"
            required
          >
            <option value="">Select your airport...</option>
            {POPULAR_AIRPORTS.map(airport => (
              <option key={airport.code} value={airport.code}>
                {airport.city} ({airport.code}) - {airport.country}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Travel Days */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">When Do You Want to Travel?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select the days of the week you prefer to fly. For example, select Friday for departures 
          and Sunday for returns to find weekend trips.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={`px-4 py-3 rounded-lg border-2 font-medium capitalize transition-colors ${
                formData.travelDays.includes(day)
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.flexibleDates}
              onChange={(e) => setFormData({ ...formData, flexibleDates: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm">
              I'm flexible with dates (search any week with these days)
            </span>
          </label>
        </div>
        
        <div className="mt-4">
          <label className="label">How many months ahead to search?</label>
          <select
            value={formData.monthsAhead}
            onChange={(e) => setFormData({ ...formData, monthsAhead: parseInt(e.target.value) })}
            className="input-field max-w-xs"
          >
            <option value="1">1 month</option>
            <option value="2">2 months</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
          </select>
        </div>
      </div>
      
      {/* Destinations */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Where Do You Want to Go?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select all destinations you're interested in. We'll search for flights to each of these cities.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {POPULAR_DESTINATIONS.map(destination => {
            const isSelected = formData.destinations.find(d => d.code === destination.code);
            return (
              <button
                key={destination.code}
                type="button"
                onClick={() => handleDestinationToggle(destination)}
                className={`px-3 py-2 rounded-lg border-2 text-left transition-colors ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{destination.city}</div>
                <div className="text-xs text-gray-600">
                  {destination.country} ({destination.code})
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-sm text-gray-500">
          {formData.destinations.length} destination{formData.destinations.length !== 1 ? 's' : ''} selected
        </div>
      </div>
      
      {/* Budget */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Budget</h2>
        <div>
          <label className="label">
            Maximum price for round-trip flight (€{formData.maxPriceRoundTrip})
          </label>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={formData.maxPriceRoundTrip}
            onChange={(e) => setFormData({ ...formData, maxPriceRoundTrip: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>€20</span>
            <span>€300</span>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            We'll only alert you about flights priced at or below €{formData.maxPriceRoundTrip} for a round trip.
          </p>
        </div>
      </div>
      
      {/* Alert Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Alert Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Email for alerts</label>
            <input
              type="email"
              value={formData.alertEmail}
              onChange={(e) => setFormData({ ...formData, alertEmail: e.target.value })}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.alertEnabled}
                onChange={(e) => setFormData({ ...formData, alertEnabled: e.target.checked })}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm">
                Send me email alerts when flights match my criteria
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialData ? 'Update Preferences' : 'Save & Start Searching'}
        </button>
        {initialData && (
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
