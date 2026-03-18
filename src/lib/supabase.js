import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEBUG LOGS: Open your browser console (F12) to see these!
console.log("Supabase URL Loaded:", !!supabaseUrl);
console.log("Supabase Key Loaded:", !!supabaseAnonKey);

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;