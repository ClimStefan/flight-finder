// =====================================================
// LANDING PAGE (Public Home Page)
// =====================================================
// This is what users see before signing in
// Shows product benefits and sign-up CTA
// =====================================================

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-600">
            ✈️ Flight Finder
          </div>
          <Link 
  href="/waitlist" 
  className="btn-secondary text-lg px-8 py-3 inline-block"
>
  Join Waitlist
</Link>
          <div className="space-x-4">
            <Link 
              href="/dashboard" 
              className="btn-primary"
            >
              Try It Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Never Miss a Cheap Flight Again
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Set your travel preferences once. Get instant alerts when flights match your budget.
          Stop manually searching dozens of sites.
        </p>
        <Link 
          href="/dashboard" 
          className="btn-primary text-lg px-8 py-3 inline-block"
        >
          Start Finding Deals - Free
        </Link>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold mb-2">Set Once, Forget</h3>
            <p className="text-gray-600">
              Choose your travel days, destinations, and budget. We do the rest.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">Auto Search</h3>
            <p className="text-gray-600">
              We check Google Flights & Skyscanner daily for deals matching your criteria.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold mb-2">Instant Alerts</h3>
            <p className="text-gray-600">
              Get emailed the moment a flight under your budget appears. Click to book.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16 bg-white rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Set Your Preferences</h3>
              <p className="text-gray-600">
                Choose when you want to travel (e.g., any Friday-Sunday), where (cities/countries), 
                and your max budget per flight.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">We Search Automatically</h3>
              <p className="text-gray-600">
                Our system checks flight prices daily across multiple platforms. 
                You see all results in one dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Get Alerted & Book</h3>
              <p className="text-gray-600">
                When a deal matches your budget, you get an email with a direct link. 
                Click and book before it's gone!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Travel More for Less?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join travelers who save hours of searching every week
        </p>
        <Link 
          href="/sign-up" 
          className="btn-primary text-lg px-8 py-3 inline-block"
        >
          Create Free Account
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 Flight Finder. Made for travelers who value their time.</p>
        </div>
      </footer>
    </div>
  );
}
