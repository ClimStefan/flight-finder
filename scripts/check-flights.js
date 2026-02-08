// =====================================================
// FLIGHT PRICE CHECKER SCRIPT
// =====================================================
// This script runs periodically (via cron or manual trigger) to:
// 1. Fetch pending flight searches from database
// 2. Visit each search URL with Puppeteer
// 3. Extract minimum price displayed
// 4. Save results to database
// 5. Send alerts if price matches user's budget
//
// Run with: node scripts/check-flights.js
// =====================================================
import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createAdminClient } from '../lib/supabase.js';
import { sendBulkFlightAlert } from './email-alerts.js';

// =====================================================
// Main execution function
// =====================================================

const dealsFound = {}; // Track deals by user


async function checkFlightPrices() {
  console.log('🚀 Starting flight price check...');
  
  const supabase = createAdminClient();
  
  try {
    // Step 1: Get searches ONLY for users who have alerts enabled
   const { data: searches, error: searchError } = await supabase
      .from('flight_searches')
      .select(`
        *,
        user_preferences (
          user_id,
          max_price_round_trip,
          alert_enabled,
          alert_email
        )
      `)
      .eq('status', 'pending')
      .or('next_check_at.is.null,next_check_at.lt.' + new Date().toISOString())
      .limit(50);
    
    if (searchError) {
      throw new Error(`Failed to fetch searches: ${searchError.message}`);
    }
    
    if (!searches || searches.length === 0) {
      console.log('✅ No pending searches to check');
      return;
    }
    
    console.log(`📋 Found ${searches.length} searches to check`);
    
    // Step 2: Launch browser
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    
    // Step 3: Process each search
    let processedCount = 0;
    let failedCount = 0;
    
    for (const search of searches) {
      try {
        console.log(`\n🔍 Checking: ${search.origin} → ${search.destination_city} on ${search.outbound_date}`);
        
        // Check Google Flights first
        const googlePrice = await checkGoogleFlights(browser, search);
        
        // Small delay between platforms to be respectful
        await sleep(2000);
        
        // Check Skyscanner
        const skyscannerPrice = await checkSkyscanner(browser, search);

         await sleep(2000);
        
        // Check Kayak
        const kayakPrice = await checkKayak(browser, search);

        await sleep(2000);
        
   // Step 4: Save results
        await saveFlightResults(supabase, search, googlePrice, skyscannerPrice, kayakPrice);
        
        // Step 5: Collect deals (we'll send ONE email later with all deals)
        const userBudget = search.user_preferences.max_price_round_trip;
        const bestPrice = Math.min(
          googlePrice || Infinity,
          skyscannerPrice || Infinity,
           kayakPrice || Infinity
        );
        
        if (bestPrice <= userBudget && search.user_preferences.alert_enabled) {
          // Store deal info (we'll group by user later)
          if (!dealsFound[search.user_preferences.user_id]) {
            dealsFound[search.user_preferences.user_id] = {
              email: search.user_preferences.alert_email,
              budget: userBudget / 100,
              deals: []
            };
          }
          
          dealsFound[search.user_preferences.user_id].deals.push({
            destination: search.destination_city,
            outboundDate: search.outbound_date,
            returnDate: search.return_date,
            price: bestPrice / 100,
            googleUrl: search.google_flights_url,
            skyscannerUrl: search.skyscanner_url,
          });
        }
        
        // Update search status
        await supabase
          .from('flight_searches')
          .update({
            status: 'completed',
            last_checked_at: new Date().toISOString(),
            next_check_at: getNextCheckTime(), // Check again in 24 hours
          })
          .eq('id', search.id);
        
        processedCount++;
        
        // Be respectful to servers - wait between searches
        await sleep(3000);
        
      } catch (error) {
        console.error(`❌ Failed to check search ${search.id}:`, error.message);
        failedCount++;
        
        // Mark as failed
        await supabase
          .from('flight_searches')
          .update({
            status: 'failed',
            last_checked_at: new Date().toISOString(),
            next_check_at: getNextCheckTime(),
          })
          .eq('id', search.id);
      }
    }
    
    // Cleanup
    await browser.close();

    // Step 6: Send ONE email per user with ALL their deals
    for (const [userId, userData] of Object.entries(dealsFound)) {
      console.log(`\n📧 Sending alert to ${userData.email} with ${userData.deals.length} deals`);
      await sendBulkFlightAlert(userData);
    }
    
    console.log(`\n✅ Finished! Processed: ${processedCount}, Failed: ${failedCount}`);
    
  } catch (error) {
    console.error('💥 Fatal error in flight price checker:', error);
    process.exit(1);
  }
}

// =====================================================
// Check Google Flights price
// =====================================================
async function checkGoogleFlights(browser, search) {
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    console.log(`  → Checking Google Flights...`);
    console.log(`  URL: ${search.google_flights_url}`);
    
    await page.goto(search.google_flights_url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    
    // IMPORTANT: Handle cookie consent popup
    try {
      // Wait for and click the "Reject all" button (Romanian: "Respinge tot")
      await page.waitForSelector('button', { timeout: 5000 });
      
      // Try to find and click the reject button
      const rejectButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent.includes('Reject') || 
          button.textContent.includes('Respinge') ||
          button.textContent.includes('respinge tot')
        );
      });
      
      if (rejectButton) {
        await rejectButton.click();
        console.log('  ✓ Rejected cookies');
        await sleep(3000); // Wait for page to reload after rejecting
      }
    } catch (e) {
      console.log('  ℹ️  No cookie popup or already handled');
    }
    
    await sleep(5000); // Wait longer for content to load

     // Wait for flight results to load
    console.log('  ⏳ Waiting for flights to load...');
   await sleep(8000); // Wait 8 seconds
    
    // Check if we're on the results page
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);
    
    // Wait for flight results to actually appear
    try {
      await page.waitForSelector('div[role="list"]', { timeout: 10000 });
      console.log('  ✓ Flight results loaded');
    } catch (e) {
      console.log('  ⚠️  Flight results not found, trying anyway...');
    }
    
    // Take a screenshot AFTER waiting
    await page.screenshot({ path: 'google-debug.png' });
    console.log(`  💾 Screenshot saved to google-debug.png`);
    
    // Look for ANY element containing a Euro sign and numbers
    let priceText = null;
    
    try {
      // Method 1: Find all text containing € and numbers
      priceText = await page.evaluate(() => {
        // Get all text on the page
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const prices = [];
        let node;
        
        while (node = walker.nextNode()) {
          const text = node.textContent.trim();
          // Match patterns like "€45", "45 €", "EUR 45"
          if (text.match(/€\s*\d+|EUR\s*\d+|\d+\s*€/)) {
            prices.push(text);
          }
        }
        
        console.log('Found price texts:', prices);
        return prices.length > 0 ? prices[0] : null;
      });
      
      if (priceText) {
        console.log(`  ✓ Found price text: "${priceText}"`);
      }
    } catch (e) {
      console.log('  ❌ Error extracting price:', e.message);
    }
    
    if (!priceText) {
      console.log('  ⚠️  Could not find any prices on page');
      console.log('  Check google-debug.png to see what the page looks like');
      return null;
    }
    
    const priceInCents = parsePrice(priceText);
    console.log(`  ✓ Google Flights: €${(priceInCents / 100).toFixed(2)}`);
    
    return priceInCents;
    
  } catch (error) {
    console.error(`  ❌ Google Flights error:`, error.message);
    return null;
  } finally {
    await page.close();
  }
}

// =====================================================
// Check Skyscanner price
// =====================================================
async function checkSkyscanner(browser, search) {
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    console.log(`  → Checking Skyscanner...`);
    console.log(`  URL: ${search.skyscanner_url}`);
    
    await page.goto(search.skyscanner_url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    await sleep(5000);
    
    // Handle cookie popup
    try {
      const acceptButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => 
          button.textContent.includes('Accept') || 
          button.textContent.includes('OK')
        );
      });
      
      if (acceptButton) {
        await acceptButton.click();
        console.log('  ✓ Accepted cookies on Skyscanner');
        await sleep(3000);
      }
    } catch (e) {
      // No popup
    }
    
    // Screenshot for debugging
    await page.screenshot({ path: 'skyscanner-debug.png' });
    console.log(`  💾 Screenshot saved to skyscanner-debug.png`);
    
    // Look for prices on Skyscanner
    let priceText = null;
    
    try {
      priceText = await page.evaluate(() => {
        // Look for any text with £, €, or currency patterns
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const prices = [];
        let node;
        
        while (node = walker.nextNode()) {
          const text = node.textContent.trim();
          if (text.match(/[£€]\s*\d+|EUR\s*\d+|\d+\s*[£€]/)) {
            prices.push(text);
          }
        }
        
        console.log('Skyscanner prices found:', prices);
        return prices.length > 0 ? prices[0] : null;
      });
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }
    
    if (!priceText) {
      console.log('  ⚠️  Could not find price on Skyscanner');
      return null;
    }
    
    const priceInCents = parsePrice(priceText);
    console.log(`  ✓ Skyscanner: €${(priceInCents / 100).toFixed(2)}`);
    
    return priceInCents;
    
  } catch (error) {
    console.error(`  ❌ Skyscanner error:`, error.message);
    return null;
  } finally {
    await page.close();
  }
}

// =====================================================
// Check Kayak price
// =====================================================
async function checkKayak(browser, search) {
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    console.log(`  → Checking Kayak...`);
    console.log(`  URL: ${search.kayak_url}`);
    
    await page.goto(search.kayak_url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    await sleep(8000); // Wait for results
    
    // Screenshot for debugging
    await page.screenshot({ path: 'kayak-debug.png' });
    console.log(`  💾 Screenshot saved to kayak-debug.png`);
    
    // Look for prices on Kayak
    let priceText = null;
    
    try {
    priceText = await page.evaluate(() => {
        const prices = [];
        
        // Look for elements that typically contain prices
        const selectors = [
          '[class*="price"]',
          '[class*="Price"]', 
          '[class*="cost"]',
          '[class*="amount"]',
          '[data-code]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            // Match ONLY standalone currency + number patterns
            // Example matches: "$217", "€217", "217 €"
            const matches = text.match(/(?:^|[^\d])([€$£]\s*\d{2,4}|\d{2,4}\s*[€$£])(?:[^\d]|$)/);
            if (matches && matches[1]) {
              prices.push(matches[1]);
            }
          });
        });
        
        console.log('Kayak prices found:', prices);
        
        // Return the first valid-looking price
        if (prices.length > 0) {
          return prices[0];
        }
        
        // Fallback: search all text but be very strict
        const allText = document.body.innerText;
        const strictMatch = allText.match(/\$\s*(\d{2,4})\b/);
        if (strictMatch) {
          return '$' + strictMatch[1];
        }
        
        return null;
      });
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }
    
    if (!priceText) {
      console.log('  ⚠️  Could not find price on Kayak');
      return null;
    }
    
    const priceInCents = parsePrice(priceText);
    console.log(`  ✓ Kayak: €${(priceInCents / 100).toFixed(2)}`);
    
    return priceInCents;
    
  } catch (error) {
    console.error(`  ❌ Kayak error:`, error.message);
    return null;
  } finally {
    await page.close();
  }
}

// =====================================================
// Save flight results to database
// =====================================================
async function saveFlightResults(supabase, search, googlePrice, skyscannerPrice, kayakPrice) {
  const results = [];
  
  // Prepare Google result
  if (googlePrice) {
    results.push({
      search_id: search.id,
      user_id: search.user_preferences.user_id,
      origin: search.origin,
      destination: search.destination,
      destination_city: search.destination_city,
      outbound_date: search.outbound_date,
      return_date: search.return_date,
      price_cents: googlePrice,
      currency: 'EUR',
      platform: 'google',
      booking_url: search.google_flights_url,
      is_deal: googlePrice <= search.user_preferences.max_price_round_trip,
    });
  }
  
  // Prepare Skyscanner result
  if (skyscannerPrice) {
    results.push({
      search_id: search.id,
      user_id: search.user_preferences.user_id,
      origin: search.origin,
      destination: search.destination,
      destination_city: search.destination_city,
      outbound_date: search.outbound_date,
      return_date: search.return_date,
      price_cents: skyscannerPrice,
      currency: 'EUR',
      platform: 'skyscanner',
      booking_url: search.skyscanner_url,
      is_deal: skyscannerPrice <= search.user_preferences.max_price_round_trip,
    });
  }

    
  // Prepare Kayak result
  if (kayakPrice) {
    results.push({
      search_id: search.id,
      user_id: search.user_preferences.user_id,
      origin: search.origin,
      destination: search.destination,
      destination_city: search.destination_city,
      outbound_date: search.outbound_date,
      return_date: search.return_date,
      price_cents: kayakPrice,
      currency: 'EUR',
      platform: 'kayak',
      booking_url: search.kayak_url,
      is_deal: kayakPrice <= search.user_preferences.max_price_round_trip,
    });
  }
  
  // Insert results
  if (results.length > 0) {
    const { error } = await supabase
      .from('flight_results')
      .insert(results);
    
    if (error) {
      console.error('Error saving flight results:', error);
    }
  }
}

// =====================================================
// Helper: Parse price from text
// =====================================================
// Handles formats like: "€45", "45 €", "$45", "45", "45.50"
function parsePrice(priceText) {
  if (!priceText) return null;
  
  console.log(`  🔍 Parsing price from: "${priceText}"`);
  
  // Extract just the number part
  const numberMatch = priceText.match(/(\d{1,4}(?:[.,]\d{2})?)/);
  
  if (!numberMatch) {
    console.log(`  ❌ No valid number found`);
    return null;
  }
  
  const cleanPrice = numberMatch[1].replace(',', '.');
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price)) return null;
  
  // Sanity check: flight prices should be between €10 and €2000
  if (price < 10 || price > 2000) {
    console.log(`  ⚠️  Rejected suspicious price: €${price}`);
    return null;
  }
  
  console.log(`  ✓ Parsed valid price: €${price}`);
  
  // Convert to cents
  return Math.round(price * 100);
}

// =====================================================
// Helper: Sleep function
// =====================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// Helper: Calculate next check time
// =====================================================
// Returns a timestamp for when this search should be checked again
// Default: 24 hours from now
function getNextCheckTime() {
  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);
  return tomorrow.toISOString();
}

// =====================================================
// Run the script
// =====================================================
checkFlightPrices()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

