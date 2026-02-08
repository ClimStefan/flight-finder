// =====================================================
// FLIGHT RESULTS COMPONENT
// =====================================================
// Displays flight search results in card format
// Shows price, dates, destination, and booking links
// Highlights deals that are under user's budget
// =====================================================

'use client';

import { format } from 'date-fns';
import { useState } from 'react';

function EnableAlertsButton() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  
  const handleEnableAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/enable-alerts', {
        method: 'POST',
      });
      
      if (response.ok) {
        setEnabled(true);
        alert('✅ Price alerts enabled! You\'ll receive an email when we find deals.');
      }
    } catch (error) {
      alert('Failed to enable alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (enabled) {
    return (
      <div className="text-green-600 font-medium">
        ✓ Alerts enabled! We'll email you when we find deals.
      </div>
    );
  }
  
  return (
    <button
      onClick={handleEnableAlerts}
      disabled={loading}
      className="btn-primary disabled:opacity-50"
    >
      {loading ? 'Enabling...' : '📧 Enable Price Alerts'}
    </button>
  );
}

export default function FlightResults({ flights, maxBudget }) {
  // Group flights by destination for better organization
  const flightsByDestination = flights.reduce((acc, flight) => {
    const dest = flight.destination_city;
    if (!acc[dest]) {
      acc[dest] = [];
    }
    acc[dest].push(flight);
    return acc;
  }, {});
  
  return (
    <div className="space-y-6">
      {Object.entries(flightsByDestination).map(([destination, destFlights]) => (
        <div key={destination}>
          <h2 className="text-xl font-semibold mb-3">{destination}</h2>
          <div className="grid gap-4">
            {destFlights.map((flight) => (
              <FlightCard 
                key={flight.id} 
                flight={flight} 
                maxBudget={maxBudget}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Individual Flight Card Component
// =====================================================
function FlightCard({ flight, maxBudget }) {
  // Determine if this is a deal (under user's budget)
  const isDeal = flight.price_cents <= maxBudget;
  
  // Format price (convert from cents to euros)
  const price = (flight.price_cents / 100).toFixed(0);
  
  // Format dates
  const outboundDate = new Date(flight.outbound_date);
  const returnDate = flight.return_date ? new Date(flight.return_date) : null;
  
  // Platform badge color
  const platformColors = {
    google: 'bg-blue-100 text-blue-800',
    skyscanner: 'bg-green-100 text-green-800',
    kayak: 'bg-orange-100 text-orange-800',
  };
  
  return (
    <div className={`card relative overflow-hidden ${isDeal ? 'ring-2 ring-green-500' : ''}`}>
      {/* Deal Badge */}
      {isDeal && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
          🎉 Great Deal!
        </div>
      )}
      
      <div className="flex justify-between items-start">
        {/* Left: Flight Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold">
              {flight.origin} → {flight.destination}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${platformColors[flight.platform] || 'bg-gray-100 text-gray-800'}`}>
              {flight.platform}
            </span>
          </div>
          
          {/* Dates */}
          <div className="text-gray-600 mb-2">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>
                {format(outboundDate, 'EEE, MMM dd')}
                {returnDate && (
                  <> → {format(returnDate, 'EEE, MMM dd')}</>
                )}
              </span>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="flex gap-4 text-sm text-gray-500">
            {flight.stops !== null && (
              <span>
                {flight.stops === 0 ? '✈️ Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </span>
            )}
            {flight.airline && (
              <span>{flight.airline}</span>
            )}
          </div>
        </div>
        
        {/* Right: Price & CTA */}
        <div className="text-right ml-4">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            €{price}
          </div>
          <a
            href={flight.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Book Now
          </a>
          <div className="text-xs text-gray-500 mt-2">
            Checked {formatTimeAgo(flight.checked_at)}
          </div>
        </div>
      </div>
      
      {/* Price History Indicator */}
      {flight.price_change_since_last && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm">
            {flight.price_change_since_last > 0 ? (
              <span className="text-red-600">
                ↑ €{Math.abs(flight.price_change_since_last / 100).toFixed(0)} increase
              </span>
            ) : (
              <span className="text-green-600">
                ↓ €{Math.abs(flight.price_change_since_last / 100).toFixed(0)} decrease
              </span>
            )}
          </div>
        </div>
      )}
      {/* Alert Setup Section */}
      <div className="card bg-yellow-50 border-yellow-200 mt-6">
        <div className="flex gap-3">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Don't see what you're looking for?</h3>
            <p className="text-sm text-gray-700 mb-4">
              Get email alerts when flights drop below your budget. We'll check prices daily and notify you of deals.
            </p>
            <div className="flex gap-3">
              <EnableAlertsButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// =====================================================
// Helper: Format relative time
// =====================================================
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return format(date, 'MMM dd');
  }
}
