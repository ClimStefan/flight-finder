'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    formData.append("access_key", "93eb64fa-c766-4104-bcf4-e4f499f468ea"); // Replace with your key

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-4">You're on the list!</h1>
          <p className="text-gray-600 mb-8">
            We'll email you when we launch. Get ready to never miss a cheap flight again!
          </p>
          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <nav className="container mx-auto px-4 py-6">
        <Link href="/" className="text-2xl font-bold text-primary-600">
          ✈️ Flight Finder
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">
            Join the Waitlist
          </h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Be the first to know when we launch our automated flight deal finder
          </p>

          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <label className="label">Your Name</label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="label">Where do you usually fly from?</label>
              <input
                type="text"
                name="home_airport"
                className="input-field"
                placeholder="e.g., London, New York, Amsterdam"
              />
            </div>

            <div>
              <label className="label">What's your typical flight budget?</label>
              <select name="budget" className="input-field">
                <option value="">Select...</option>
                <option value="under_50">Under €50</option>
                <option value="50-100">€50-100</option>
                <option value="100-200">€100-200</option>
                <option value="200+">€200+</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}