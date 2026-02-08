
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServerClient();
    
    // Update user preferences to enable alerts
    await supabase
      .from('user_preferences')
      .update({ 
        alert_enabled: true,
        alert_mode: 'on_demand'
      })
      .eq('user_id', userId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Enable alerts error:', error);
    return NextResponse.json({ error: 'Failed to enable alerts' }, { status: 500 });
  }
}