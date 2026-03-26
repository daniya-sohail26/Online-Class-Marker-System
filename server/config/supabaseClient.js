import { createClient } from '@supabase/supabase-js';

// 1. Detect environment and get variables safely
const isBrowser = typeof window !== 'undefined';

const supabaseUrl = isBrowser 
  ? import.meta.env.VITE_SUPABASE_URL 
  : process.env.VITE_SUPABASE_URL;

const supabaseAnonKey = isBrowser 
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : process.env.VITE_SUPABASE_ANON_KEY;

// 2. Debugging (Optional: remove once working)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`❌ Supabase keys missing in ${isBrowser ? 'Browser' : 'Server'}!`);
}

// 3. Initialize Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Only use window.localStorage if we are in a browser
    storage: isBrowser ? window.localStorage : undefined 
  }
});