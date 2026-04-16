import { createClient } from '@supabase/supabase-js';

// 1. Detect environment and get variables safely
const isBrowser = typeof window !== 'undefined';

const supabaseUrl = isBrowser
  ? import.meta.env.VITE_SUPABASE_URL
  : process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';

const supabaseAnonKey = isBrowser
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// On the server, use the service role key to bypass RLS (auth is handled by middleware)
const supabaseKey = isBrowser
  ? supabaseAnonKey
  : process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// 2. Debugging (Optional: remove once working)
if (!supabaseUrl || !supabaseKey) {
  console.error(`❌ Supabase keys missing in ${isBrowser ? 'Browser' : 'Server'}!`);
}

// 3. Initialize Client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
    // Only use window.localStorage if we are in a browser
    storage: isBrowser ? window.localStorage : undefined
  }
});