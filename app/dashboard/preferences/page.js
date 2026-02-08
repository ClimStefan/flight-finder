import { redirect } from 'next/navigation';
import { createServerClient } from '../../../lib/supabase';
import PreferencesForm from '../../../components/PreferencesForm';
import GetUserIdClient from '../../../components/GetUserIdClient';

async function getUserPreferences(userId) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
  }
  
  return data || null;
}

export default async function PreferencesPage({ searchParams }) {
  const userId = searchParams?.userId;
  
  if (!userId) {
    return <GetUserIdClient />;
  }
  
  const preferences = await getUserPreferences(userId);
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Travel Preferences</h1>
        <p className="text-gray-600">
          Tell us what you're looking for and we'll automatically search for flights that match.
        </p>
      </div>
      
      <PreferencesForm 
        userId={userId} 
        initialData={preferences} 
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';