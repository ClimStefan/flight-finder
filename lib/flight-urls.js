// =====================================================
// FLIGHT URL BUILDERS
// =====================================================
// These functions construct search URLs for different flight platforms
// Each platform has its own URL structure with specific parameters
// =====================================================

import { format } from 'date-fns';

// =====================================================
// Google Flights URL Builder
// =====================================================
// Constructs a Google Flights search URL with pre-filled parameters
// 
// Parameters:
// - origin: IATA airport code (e.g., 'AMS')
// - destination: IATA airport code (e.g., 'BCN')
// - outboundDate: JavaScript Date object
// - returnDate: JavaScript Date object (optional for one-way)
// - passengers: number of passengers (default: 1)
// 
// Returns: Full Google Flights URL
export function buildGoogleFlightsUrl(origin, destination, outboundDate, returnDate = null, passengers = 1) {
  // Format dates as YYYY-MM-DD
  const outbound = format(outboundDate, 'yyyy-MM-dd');
  
  // Simple, working Google Flights URL format
  if (returnDate) {
    const returnStr = format(returnDate, 'yyyy-MM-dd');
    // Round trip format: flights from ORIGIN to DEST on DATE returning DATE
    return `https://www.google.com/travel/flights?q=flights%20from%20${origin}%20to%20${destination}%20on%20${outbound}%20returning%20${returnStr}`;
  } else {
    // One way format
    return `https://www.google.com/travel/flights?q=flights%20from%20${origin}%20to%20${destination}%20on%20${outbound}`;
  }
}

// =====================================================
// Skyscanner URL Builder
// =====================================================
// Constructs a Skyscanner search URL with pre-filled parameters
// 
// Skyscanner URL structure is more straightforward:
// /transport/flights/{origin}/{destination}/{outbound}/{return}/?params
export function buildSkyscannerUrl(origin, destination, outboundDate, returnDate = null, passengers = 1) {
  // Skyscanner uses lowercase airport codes in URL
  const originLower = origin.toLowerCase();
  const destLower = destination.toLowerCase();
  
  // Format dates as YYMMDD
  const outbound = format(outboundDate, 'yyMMdd');
  
  if (returnDate) {
    const returnFormatted = format(returnDate, 'yyMMdd');
    // Round trip
    return `https://www.skyscanner.net/transport/flights/${originLower}/${destLower}/${outbound}/${returnFormatted}/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
  } else {
    // One way
    return `https://www.skyscanner.net/transport/flights/${originLower}/${destLower}/${outbound}/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=0`;
  }
}

// =====================================================
// Kayak URL Builder (optional, for future expansion)
// =====================================================
export function buildKayakUrl(origin, destination, outboundDate, returnDate = null, passengers = 1) {
  // Format dates as YYYY-MM-DD
  const outbound = format(outboundDate, 'yyyy-MM-dd');
  
  if (returnDate) {
    const returnStr = format(returnDate, 'yyyy-MM-dd');
    // Round trip format
    return `https://www.kayak.com/flights/${origin}-${destination}/${outbound}/${returnStr}?sort=bestflight_a&fs=stops=0`;
  } else {
    // One way
    return `https://www.kayak.com/flights/${origin}-${destination}/${outbound}?sort=bestflight_a`;
  }
}

// =====================================================
// Helper: Get all search URLs for a flight
// =====================================================
// Returns an object with URLs for all supported platforms
export function getAllSearchUrls(origin, destination, outboundDate, returnDate = null, passengers = 1) {
  return {
    google: buildGoogleFlightsUrl(origin, destination, outboundDate, returnDate, passengers),
    skyscanner: buildSkyscannerUrl(origin, destination, outboundDate, returnDate, passengers),
    kayak: buildKayakUrl(origin, destination, outboundDate, returnDate, passengers),
  };
}

// =====================================================
// Helper: Validate IATA codes
// =====================================================
// Basic validation for airport codes (3 uppercase letters)
export function isValidIataCode(code) {
  const iataRegex = /^[A-Z]{3}$/;
  return iataRegex.test(code);
}

// =====================================================
// Example usage (for reference):
// =====================================================
/*
const urls = getAllSearchUrls(
  'AMS', // Amsterdam
  'BCN', // Barcelona
  new Date('2024-12-20'), // Friday
  new Date('2024-12-22'), // Sunday
  1 // 1 passenger
);

console.log(urls.google);
console.log(urls.skyscanner);
*/
