// =====================================================
// DATE UTILITIES FOR FLIGHT SEARCHES
// =====================================================
// Helper functions to generate travel dates based on user preferences
// For example: "Find all Fridays in the next 3 months"
// =====================================================

import { 
  addDays, 
  addMonths, 
  format, 
  startOfDay, 
  isBefore, 
  isAfter,
  getDay,
  eachDayOfInterval 
} from 'date-fns';

// =====================================================
// Day of week mapping
// =====================================================
const DAY_MAP = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
};

// =====================================================
// Get all dates for specific days of the week
// =====================================================
// Example: Get all Fridays in the next 3 months
// 
// Parameters:
// - daysOfWeek: array of day names ['friday', 'saturday']
// - monthsAhead: how many months to look ahead (default: 3)
// - startDate: start searching from this date (default: today)
// 
// Returns: Array of Date objects
export function getDatesForDaysOfWeek(daysOfWeek, monthsAhead = 3, startDate = new Date()) {
  const start = startOfDay(startDate);
  const end = addMonths(start, monthsAhead);
  
  // Convert day names to numbers (0-6)
  const dayNumbers = daysOfWeek.map(day => DAY_MAP[day.toLowerCase()]);
  
  // Get all days in the date range
  const allDays = eachDayOfInterval({ start, end });
  
  // Filter for only the requested days of week
  const matchingDates = allDays.filter(date => {
    const dayOfWeek = getDay(date);
    return dayNumbers.includes(dayOfWeek);
  });
  
  return matchingDates;
}

// =====================================================
// Generate weekend trip combinations
// =====================================================
// Creates Friday-Sunday or custom day combinations
// 
// Parameters:
// - outboundDays: array of day names for outbound ['friday']
// - returnDays: array of day names for return ['sunday', 'monday']
// - monthsAhead: how many months to look ahead
// 
// Returns: Array of { outbound: Date, return: Date } objects
export function generateTripCombinations(outboundDays, returnDays, monthsAhead = 3) {
  const outboundDates = getDatesForDaysOfWeek(outboundDays, monthsAhead);
  const returnDates = getDatesForDaysOfWeek(returnDays, monthsAhead);
  
  const combinations = [];
  
  // For each outbound date, find valid return dates
  outboundDates.forEach(outbound => {
    // Return must be after outbound
    const validReturns = returnDates.filter(returnDate => {
      return isAfter(returnDate, outbound);
    });
    
    // Take the closest return date (first one after outbound)
    if (validReturns.length > 0) {
      const closestReturn = validReturns[0];
      
      // Only add if return is within reasonable timeframe (e.g., within 7 days)
      const daysDiff = Math.floor((closestReturn - outbound) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        combinations.push({
          outbound,
          return: closestReturn,
        });
      }
    }
  });
  
  return combinations;
}

// =====================================================
// Get next occurrence of a specific day
// =====================================================
// Example: Get next Friday from today
export function getNextDayOfWeek(dayName, fromDate = new Date()) {
  const targetDay = DAY_MAP[dayName.toLowerCase()];
  const currentDay = getDay(fromDate);
  
  // Calculate days until target day
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week
  }
  
  return addDays(fromDate, daysUntil);
}

// =====================================================
// Generate Friday-Sunday weekends
// =====================================================
// Convenience function for the most common use case
// Returns all Friday-Sunday weekends in the next N months
export function getFridaySundayWeekends(monthsAhead = 3) {
  return generateTripCombinations(['friday'], ['sunday'], monthsAhead);
}

// =====================================================
// Generate flexible weekend combinations
// =====================================================
// Creates multiple weekend patterns:
// - Friday-Sunday
// - Friday-Monday
// - Saturday-Sunday
// - Saturday-Monday
export function getFlexibleWeekends(monthsAhead = 3) {
  const patterns = [
    { outbound: ['friday'], return: ['sunday'] },
    { outbound: ['friday'], return: ['monday'] },
    { outbound: ['saturday'], return: ['sunday'] },
    { outbound: ['saturday'], return: ['monday'] },
  ];
  
  const allCombinations = [];
  
  patterns.forEach(pattern => {
    const trips = generateTripCombinations(
      pattern.outbound, 
      pattern.return, 
      monthsAhead
    );
    allCombinations.push(...trips);
  });
  
  // Remove duplicates and sort by outbound date
  const uniqueTrips = Array.from(
    new Map(
      allCombinations.map(trip => [
        `${trip.outbound.getTime()}-${trip.return.getTime()}`,
        trip
      ])
    ).values()
  ).sort((a, b) => a.outbound - b.outbound);
  
  return uniqueTrips;
}

// =====================================================
// Format date range for display
// =====================================================
export function formatDateRange(outbound, returnDate) {
  if (!returnDate) {
    return format(outbound, 'MMM dd, yyyy');
  }
  
  // If same month, show: "Dec 20 - 22, 2024"
  if (outbound.getMonth() === returnDate.getMonth() && 
      outbound.getFullYear() === returnDate.getFullYear()) {
    return `${format(outbound, 'MMM dd')} - ${format(returnDate, 'dd, yyyy')}`;
  }
  
  // Different months: "Dec 29 - Jan 2, 2024"
  if (outbound.getFullYear() === returnDate.getFullYear()) {
    return `${format(outbound, 'MMM dd')} - ${format(returnDate, 'MMM dd, yyyy')}`;
  }
  
  // Different years: "Dec 29, 2024 - Jan 2, 2025"
  return `${format(outbound, 'MMM dd, yyyy')} - ${format(returnDate, 'MMM dd, yyyy')}`;
}

// =====================================================
// Example usage (for testing):
// =====================================================
/*
// Get all Fridays in next 3 months
const fridays = getDatesForDaysOfWeek(['friday'], 3);
console.log('Next Fridays:', fridays.slice(0, 5));

// Get Friday-Sunday weekends
const weekends = getFridaySundayWeekends(3);
console.log('Next weekends:', weekends.slice(0, 3));

// Flexible weekends
const flexible = getFlexibleWeekends(2);
console.log('Flexible options:', flexible.slice(0, 5));
*/
