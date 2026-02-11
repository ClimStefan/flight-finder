'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-primary-600">
              ✈️ Flight Finder
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link 
                href={userId ? `/dashboard?userId=${userId}` : '/dashboard'}
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link 
                href={userId ? `/dashboard/preferences?userId=${userId}` : '/dashboard/preferences'}
                className="text-gray-600 hover:text-gray-900"
              >
                Preferences
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}