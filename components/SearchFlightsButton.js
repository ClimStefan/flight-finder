'use client';

import { useState } from 'react';

export default function SearchFlightsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleSearch = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/run-scraper', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        // Auto-refresh after 3 minutes to show results
        setTimeout(() => {
          window.location.reload();
        }, 180000);
      } else {
        setMessage('Failed to start search. Please try again.');
      }
    } catch (error) {
      setMessage('Error starting search. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
      <div>
        <h3 className="font-semibold text-lg mb-2">🔍 Check Current Prices</h3>
        <p className="text-sm text-gray-700 mb-4">
          Click the button below to search for flights matching your preferences. 
          This takes about 2-3 minutes.
        </p>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Searching...' : '🔍 Search Flights Now'}
        </button>
        
        {message && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            {message}
          </div>
        )}
        
        {loading && (
          <div className="mt-4 text-sm text-gray-600">
            <p>⏳ Checking prices on Google Flights, Skyscanner, and Kayak...</p>
            <p className="mt-2">This page will auto-refresh in 3 minutes to show results.</p>
            <p className="mt-1 text-xs text-gray-500">(Or refresh manually anytime after 2 minutes)</p>
          </div>
        )}
      </div>
    </div>
  );
}