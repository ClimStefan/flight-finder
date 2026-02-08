# Flight Finder - Complete Setup Guide

This guide will walk you through setting up the Flight Finder application from scratch.

## 📋 Prerequisites Checklist

Before you start, make sure you have:
- [ ] Node.js 18 or higher installed ([Download](https://nodejs.org/))
- [ ] Git installed
- [ ] A code editor (VS Code recommended)
- [ ] A Supabase account (free tier is fine)
- [ ] A Clerk account (free tier is fine)
- [ ] A Resend account (free tier is fine)

## 🚀 Step-by-Step Setup

### Step 1: Project Setup

```bash
# Navigate to your projects directory
cd ~/projects  # or wherever you keep your projects

# If cloning from git:
git clone <your-repo-url>
cd flight-finder

# Install dependencies
npm install
```

### Step 2: Supabase Setup

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name (e.g., "flight-finder")
   - Set a strong database password (save this!)
   - Select a region close to you
   - Click "Create new project" (takes ~2 minutes)

2. **Run the Database Schema**
   - Once your project is ready, go to "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy the ENTIRE contents of `supabase/schema.sql`
   - Paste into the SQL editor
   - Click "Run" (bottom right)
   - You should see "Success" - this creates all your tables

3. **Get Your API Keys**
   - Go to "Settings" → "API"
   - Copy these 3 values:
     - **Project URL** (looks like: https://xxxxx.supabase.co)
     - **anon public** key (starts with "eyJhbGc...")
     - **service_role** key (starts with "eyJhbGc..." - KEEP THIS SECRET!)

### Step 3: Clerk Setup

1. **Create a Clerk Application**
   - Go to [https://clerk.com](https://clerk.com)
   - Click "Add application"
   - Name it "Flight Finder"
   - Enable only "Email" authentication (disable others for simplicity)
   - Click "Create application"

2. **Get Your API Keys**
   - You'll see your keys immediately after creation
   - Copy both:
     - **Publishable key** (starts with "pk_test_...")
     - **Secret key** (starts with "sk_test_..." - KEEP THIS SECRET!)

3. **Configure URLs** (Important!)
   - Go to "Configure" → "Paths" in Clerk dashboard
   - Set these values:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in URL: `/dashboard`
     - After sign-up URL: `/dashboard`

### Step 4: Resend Setup

1. **Create a Resend Account**
   - Go to [https://resend.com](https://resend.com)
   - Sign up with GitHub or email
   - Verify your email

2. **Add Your Domain** (or use their test domain for now)
   - For testing: use `onboarding@resend.dev` as your from email
   - For production: 
     - Go to "Domains" → "Add Domain"
     - Follow their DNS setup instructions
     - This takes 5-10 minutes to verify

3. **Get API Key**
   - Go to "API Keys"
   - Click "Create API Key"
   - Name it "Flight Finder"
   - Copy the key (starts with "re_..." - KEEP THIS SECRET!)

### Step 5: Environment Variables

1. **Create .env.local file**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in ALL values** (open .env.local in your editor):

   ```env
   # Clerk (from Step 3)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   CLERK_SECRET_KEY=sk_test_your_actual_key_here
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # Supabase (from Step 2)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key

   # Resend (from Step 4)
   RESEND_API_KEY=re_your_actual_key_here
   ALERT_FROM_EMAIL=onboarding@resend.dev

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Double-check**:
   - All keys should be real values, not "your_actual_key_here"
   - No spaces before or after the `=` sign
   - No quotes around values
   - Save the file!

### Step 6: Test the Application

```bash
# Start the development server
npm run dev
```

You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in X.Xs
```

**Open [http://localhost:3000](http://localhost:3000) in your browser**

### Step 7: Create Your First Account

1. Click "Get Started" or "Sign Up"
2. Enter an email and password
3. Check your email for verification code
4. You should be redirected to `/dashboard`

### Step 8: Set Up Preferences

1. Click "Set Up Preferences"
2. Fill out the form:
   - **Home Airport**: Choose Amsterdam (or yours)
   - **Travel Days**: Select Friday and Sunday
   - **Destinations**: Choose 2-3 cities (start small)
   - **Budget**: Set to €60 for testing
   - **Email**: Enter your email
3. Click "Save & Start Searching"

You should see a success message and be redirected to dashboard!

### Step 9: Generate Test Searches

The system automatically creates flight searches when you save preferences. To verify:

1. Go to Supabase dashboard
2. Click "Table Editor"
3. Select `flight_searches` table
4. You should see rows created (one for each destination × date combination)

### Step 10: Run Price Checker (Manual Test)

```bash
# In a new terminal (keep dev server running)
npm run check-flights
```

You should see output like:
```
🚀 Starting flight price check...
📋 Found X searches to check
🌐 Launching browser...
🔍 Checking: AMS → Barcelona on 2024-12-20
  → Checking Google Flights...
  ✓ Google Flights: €45.00
  → Checking Skyscanner...
  ✓ Skyscanner: €42.00
✅ Finished! Processed: X, Failed: 0
```

**Note**: First run might take 2-5 minutes depending on how many searches you have.

### Step 11: Check Results

1. Go back to your browser (http://localhost:3000/dashboard)
2. Refresh the page
3. You should now see flight results!
4. Check your email for any alerts (if flights were under €60)

## 🎉 Success!

If you see flight results, congratulations! Your system is working.

## 🔧 Troubleshooting

### "Unauthorized" or blank dashboard
- Check your Clerk keys in .env.local
- Make sure you're signed in
- Try clearing cookies and signing in again

### No flight results after running check-flights
- Check the console output for errors
- Verify Supabase connection (check service role key)
- Try running with fewer destinations first

### Email alerts not received
- Check Resend dashboard for send status
- Verify RESEND_API_KEY is correct
- Check spam folder
- For testing, use `onboarding@resend.dev` as from email

### Puppeteer errors
```bash
# Ubuntu/Debian:
sudo apt-get install -y chromium-browser

# macOS:
# Puppeteer should work out of the box

# Windows:
# Puppeteer includes Chrome automatically
```

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
- Double-check SUPABASE_URL and ANON_KEY
- Verify database schema was created (check Table Editor in Supabase)
- Check Supabase project is not paused (free tier pauses after 7 days of inactivity)

## 📱 Next Steps

### Set Up Automated Checking

The price checker needs to run regularly. Choose one option:

**Option A: Cron Job (Linux/Mac)**
```bash
crontab -e

# Add this line (runs daily at 8 AM):
0 8 * * * cd /path/to/flight-finder && npm run check-flights
```

**Option B: Task Scheduler (Windows)**
- Open Task Scheduler
- Create Basic Task
- Trigger: Daily at 8 AM
- Action: Start a program
- Program: `C:\Program Files\nodejs\node.exe`
- Arguments: `scripts/check-flights.js`
- Start in: `C:\path\to\flight-finder`

**Option C: Deploy to Production** (recommended for real use)
- See deployment section in README.md

### Add More Features

- [ ] Add more destination cities in PreferencesForm.js
- [ ] Customize email templates in email-alerts.js
- [ ] Add price history charts
- [ ] Set up different alert frequencies (daily vs instant)

## 🚀 Deployment

When you're ready to deploy for real use:

1. **Deploy Frontend** (Vercel)
   - Push code to GitHub
   - Import project on Vercel
   - Add all environment variables
   - Deploy!

2. **Deploy Price Checker** (Railway/Render)
   - Create new service on Railway or Render
   - Connect your GitHub repo
   - Set up cron job to run `npm run check-flights`
   - Add environment variables

3. **Set Up Domain**
   - Add custom domain on Vercel
   - Verify domain on Resend
   - Update NEXT_PUBLIC_APP_URL and ALERT_FROM_EMAIL

## 📞 Getting Help

If you're stuck:
1. Check the error messages carefully
2. Review this guide again
3. Check the main README.md for more details
4. Open an issue on GitHub

## 🎯 Quick Reference

**Start dev server**: `npm run dev`  
**Run price checker**: `npm run check-flights`  
**View database**: Supabase dashboard → Table Editor  
**View logs**: Check terminal where you ran commands  
**Reset database**: Re-run schema.sql in Supabase SQL Editor

---

Happy flight hunting! ✈️
