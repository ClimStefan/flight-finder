# Flight Finder

A personal flight monitoring tool that automates searching for cheap flights based on your preferences.

## Features
- 🎯 Set travel preferences once (days, destinations, budget)
- 🔍 Automatically searches Google Flights & Skyscanner
- 📧 Email alerts when flights match your criteria
- 🔗 Direct links to booking platforms
- 📊 Track price history and trends
- ⚡ Built with Next.js 14, Supabase, and Clerk

## How It Works

1. **Set Your Preferences**: Choose your home airport, travel days (e.g., Friday-Sunday), destinations, and max budget
2. **Automatic Monitoring**: Our system checks flight prices daily across multiple platforms
3. **Get Alerted**: Receive email alerts when flights under your budget appear
4. **Book Instantly**: Click the link in the alert to book directly on the platform

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Email**: Resend
- **Web Scraping**: Puppeteer
- **Hosting**: Vercel (recommended)

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Clerk account
- A Resend account (for emails)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd flight-finder
npm install
```

### 2. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and API keys

### 3. Set Up Clerk

1. Create a new application on [Clerk](https://clerk.com)
2. Enable email authentication
3. Copy your publishable key and secret key

### 4. Set Up Resend

1. Create an account on [Resend](https://resend.com)
2. Verify your sending domain
3. Generate an API key

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in all the values:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Resend
RESEND_API_KEY=re_...
ALERT_FROM_EMAIL=alerts@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7. Set Up Price Checking

The `scripts/check-flights.js` script needs to run periodically to check prices.

**Option A: Manual Testing**
```bash
npm run check-flights
```

**Option B: Cron Job (Production)**

On your server, set up a cron job to run daily:
```bash
crontab -e

# Add this line (runs at 8 AM daily):
0 8 * * * cd /path/to/flight-finder && npm run check-flights >> /var/log/flight-checker.log 2>&1
```

**Option C: Vercel Cron (Recommended)**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-flights",
    "schedule": "0 8 * * *"
  }]
}
```

Then create `/app/api/cron/check-flights/route.js` that calls your checker script.

## Project Structure

```
flight-finder/
├── app/                    # Next.js app directory
│   ├── dashboard/          # User dashboard pages
│   │   ├── page.js         # Main dashboard (flight results)
│   │   └── preferences/    # Preferences page
│   ├── api/                # API routes
│   │   └── preferences/    # Save user preferences
│   ├── layout.js           # Root layout with Clerk
│   ├── page.js             # Landing page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── FlightResults.js    # Display flight cards
│   └── PreferencesForm.js  # User preferences form
├── lib/                    # Utility functions
│   ├── supabase.js         # Supabase client setup
│   ├── flight-urls.js      # URL builders for platforms
│   └── date-utils.js       # Date manipulation helpers
├── scripts/                # Background jobs
│   ├── check-flights.js    # Puppeteer price checker
│   └── email-alerts.js     # Email sending logic
├── supabase/              
│   └── schema.sql          # Database schema
└── middleware.js           # Clerk authentication middleware
```

## Database Schema

The app uses 5 main tables:

1. **user_preferences**: User travel settings
2. **flight_searches**: Generated search combinations
3. **flight_results**: Actual prices found
4. **alert_history**: Track sent alerts
5. **price_history**: Historical price data

All tables have Row Level Security (RLS) enabled to protect user data.

## How the System Works

### Flow Diagram

```
User Sets Preferences
        ↓
API generates flight_searches
(all combinations of dates × destinations)
        ↓
Cron job runs check-flights.js
        ↓
Puppeteer visits each search URL
        ↓
Extracts price from page
        ↓
Saves to flight_results table
        ↓
If price ≤ budget → Send alert email
        ↓
User clicks email → Books on platform
```

### Price Checking Logic

The Puppeteer script:
1. Fetches pending searches from database
2. Visits Google Flights URL
3. Extracts minimum price using CSS selectors
4. Waits 2 seconds (respectful scraping)
5. Visits Skyscanner URL
6. Extracts price
7. Saves both prices to database
8. Compares with user budget
9. Sends email if it's a deal

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important**: You'll need a separate server/cron for the Puppeteer script since Vercel has serverless limitations. Consider:
- Railway
- Render
- DigitalOcean
- AWS Lambda with Puppeteer layer

## Customization

### Add More Airports/Destinations

Edit `components/PreferencesForm.js`:

```javascript
const POPULAR_AIRPORTS = [
  { code: 'JFK', city: 'New York', country: 'USA' },
  // Add more...
];
```

### Add More Platforms

1. Create URL builder in `lib/flight-urls.js`
2. Add price checker in `scripts/check-flights.js`
3. Update database to store new platform URLs

### Change Alert Frequency

Edit `scripts/check-flights.js`:

```javascript
function getNextCheckTime() {
  const nextCheck = new Date();
  nextCheck.setHours(nextCheck.getHours() + 12); // Check every 12 hours
  return nextCheck.toISOString();
}
```

## Troubleshooting

### Puppeteer fails to launch

Install dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# or use bundled chromium
npm install puppeteer --save
```

### Price selectors not working

Flight platforms change their HTML frequently. Update selectors in `scripts/check-flights.js`:

```javascript
const priceSelectors = [
  'new-selector-here',
  // Fallbacks...
];
```

### Emails not sending

1. Verify your domain on Resend
2. Check `RESEND_API_KEY` is set
3. Check logs: `console.log` in `scripts/email-alerts.js`

## Roadmap

- [ ] Add more platforms (Kayak, Momondo)
- [ ] SMS alerts via Twilio
- [ ] Price drop notifications
- [ ] Mobile app
- [ ] Hotel + flight bundles
- [ ] Flexible date ranges (±3 days)
- [ ] Multi-city trips

## Contributing

Pull requests welcome! Please:
1. Test changes locally
2. Update documentation
3. Follow existing code style

## License

MIT

## Support

For issues or questions:
- Open a GitHub issue
- Email: your@email.com

---

Built by travelers, for travelers ✈️

