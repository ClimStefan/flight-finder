import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(request) {
  try {
    // No auth check needed
    console.log('Starting flight price check...');
    
    exec('node scripts/check-flights.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Scraper error: ${error}`);
        return;
      }
      console.log(`Scraper output: ${stdout}`);
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Flight search started! Results will appear in 2-3 minutes. Refresh this page to see them.'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to start search' }, { status: 500 });
  }
}