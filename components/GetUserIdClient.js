'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GetUserIdClient() {
  const router = useRouter();
  
  useEffect(() => {
    // Get or create user ID
    let userId = localStorage.getItem('flight_finder_user_id');
    
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('flight_finder_user_id', userId);
    }
    
    // Reload page with userId parameter
    router.push(`/dashboard?userId=${userId}`);
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">✈️</div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}