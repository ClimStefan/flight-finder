// =====================================================
// EMAIL ALERT SYSTEM
// =====================================================
// Sends email alerts to users when flights match their criteria
// Uses Resend API for email delivery
// =====================================================
import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.ALERT_FROM_EMAIL || 'alerts@flightfinder.com';

// =====================================================
// Send flight alert email
// =====================================================
// Parameters:
// - email: recipient email
// - destination: destination city name
// - outboundDate: departure date (YYYY-MM-DD)
// - returnDate: return date (YYYY-MM-DD)
// - price: flight price in euros
// - budget: user's max budget in euros
// - googleUrl: Google Flights booking URL
// - skyscannerUrl: Skyscanner booking URL
export async function sendFlightAlert({
  email,
  destination,
  outboundDate,
  returnDate,
  price,
  budget,
  googleUrl,
  skyscannerUrl,
}) {
  try {
    console.log(`📧 Sending alert to ${email} for ${destination} at €${price}`);
    
    // Format dates for display
    const outbound = new Date(outboundDate);
    const returnD = returnDate ? new Date(returnDate) : null;
    
    const outboundFormatted = outbound.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    
    const returnFormatted = returnD ? returnD.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) : null;
    
    // Create email HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: white;
      border: 1px solid #e5e7eb;
      border-top: none;
      padding: 30px 20px;
      border-radius: 0 0 10px 10px;
    }
    .deal-badge {
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .flight-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .price {
      font-size: 36px;
      font-weight: bold;
      color: #2563eb;
      margin: 10px 0;
    }
    .date-range {
      font-size: 18px;
      color: #4b5563;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 10px 10px 10px 0;
    }
    .secondary-button {
      display: inline-block;
      background: white;
      color: #2563eb;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      border: 2px solid #2563eb;
      margin: 10px 10px 10px 0;
    }
    .savings {
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ Cheap Flight Alert!</h1>
  </div>
  
  <div class="content">
    <div class="deal-badge">🎉 Under Budget!</div>
    
    <h2>Flight to ${destination}</h2>
    
    <div class="flight-details">
      <div class="price">€${price.toFixed(2)}</div>
      <div class="date-range">
        ${outboundFormatted} ${returnFormatted ? `→ ${returnFormatted}` : '(one-way)'}
      </div>
      ${price < budget ? `
        <div class="savings">
          💰 €${(budget - price).toFixed(2)} under your budget!
        </div>
      ` : ''}
    </div>
    
    <p>
      We found a flight matching your preferences! This deal won't last long, 
      so book quickly if you're interested.
    </p>
    
    <div style="margin: 30px 0;">
      <a href="${googleUrl}" class="cta-button">
        Book on Google Flights
      </a>
      <a href="${skyscannerUrl}" class="secondary-button">
        View on Skyscanner
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      <strong>Tip:</strong> Prices can change quickly! We recommend booking 
      within the next few hours if this trip works for you.
    </p>
  </div>
  
  <div class="footer">
    <p>
      You're receiving this email because you set up flight alerts on Flight Finder.<br>
      To manage your preferences or unsubscribe, visit your dashboard.
    </p>
  </div>
</body>
</html>
    `;
    
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `✈️ Cheap flight to ${destination} - €${price.toFixed(0)}!`,
      html: htmlContent,
    });
    
    if (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
    
    console.log('✅ Email sent successfully:', data.id);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending flight alert:', error);
    return false;
  }
}

// Send bulk alert with multiple deals
// =====================================================
export async function sendBulkFlightAlert({ email, budget, deals }) {
  try {
    console.log(`📧 Sending bulk alert to ${email} with ${deals.length} deals`);
    
    // Build HTML for all deals
    const dealsHtml = deals.map(deal => `
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0;">${deal.destination}</h3>
        <div style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 10px 0;">
          €${deal.price.toFixed(0)}
        </div>
        <div style="color: #6b7280; margin-bottom: 15px;">
          ${new Date(deal.outboundDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          ${deal.returnDate ? ' → ' + new Date(deal.returnDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
        </div>
        <a href="${deal.googleUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
          Book on Google Flights
        </a>
        <a href="${deal.skyscannerUrl}" style="display: inline-block; background: white; color: #2563eb; padding: 10px 20px; text-decoration: none; border-radius: 6px; border: 2px solid #2563eb;">
          View on Skyscanner
        </a>
      </div>
    `).join('');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: white;
      border: 1px solid #e5e7eb;
      border-top: none;
      padding: 30px 20px;
      border-radius: 0 0 10px 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ ${deals.length} Cheap Flight${deals.length > 1 ? 's' : ''} Found!</h1>
  </div>
  
  <div class="content">
    <p>Great news! We found ${deals.length} flight${deals.length > 1 ? 's' : ''} under your €${budget} budget:</p>
    
    ${dealsHtml}
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      <strong>Tip:</strong> These prices can change quickly! Book within the next few hours if interested.
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p>You're receiving this because you set up flight alerts on Flight Finder.</p>
  </div>
</body>
</html>
    `;
    
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `✈️ ${deals.length} cheap flight${deals.length > 1 ? 's' : ''} found!`,
      html: htmlContent,
    });
    
    console.log('✅ Bulk email sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error sending bulk alert:', error);
    return false;
  }
}

// =====================================================
// Send welcome email when user sets up preferences
// =====================================================
export async function sendWelcomeEmail(email, destinationCount) {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
    }
    .emoji {
      font-size: 64px;
    }
    h1 {
      color: #2563eb;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="emoji">✈️</div>
    <h1>You're All Set!</h1>
  </div>
  
  <p>Welcome to Flight Finder! We're now monitoring ${destinationCount} destinations for cheap flights.</p>
  
  <p>Here's what happens next:</p>
  
  <ol>
    <li>We'll automatically search for flights matching your preferences</li>
    <li>When we find deals under your budget, you'll get an email alert</li>
    <li>Click the link in the alert to book directly on Google Flights or Skyscanner</li>
  </ol>
  
  <p>
    <strong>First check happens within 24 hours.</strong> After that, we check daily for new deals.
  </p>
  
  <div style="text-align: center;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">
      View Your Dashboard
    </a>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
    Happy travels! 🌍
  </p>
</body>
</html>
    `;
    
    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: '✈️ Your Flight Alerts Are Active!',
      html: htmlContent,
    });
    
    console.log('✅ Welcome email sent to', email);
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
}
