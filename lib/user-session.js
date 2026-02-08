export function getUserId() {
  if (typeof window === 'undefined') return null;
  
  let userId = localStorage.getItem('flight_finder_user_id');
  
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('flight_finder_user_id', userId);
  }
  
  return userId;
}