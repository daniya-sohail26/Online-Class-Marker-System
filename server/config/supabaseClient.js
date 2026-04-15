import { createClient } from '@supabase/supabase-js';

// 1. Determine if we are in Node.js or the Browser
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

let supabaseUrl;
let supabaseAnonKey;

if (isNode) {
  // --- BACKEND (Node.js) ---
  // We use dynamic imports or just check process.env
  // Note: For backend, ensure you run 'node index.js' with environment variables loaded
  supabaseUrl = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
} else {
  // --- FRONTEND (Vite/Browser) ---
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

// 2. Debug check
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`❌ Supabase keys missing! Environment: ${isNode ? 'Node.js/Server' : 'Browser/Vite'}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);