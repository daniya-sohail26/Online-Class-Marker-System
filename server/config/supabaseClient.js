import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from current dir, then from root .env.local
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are missing!');
    console.log('CWD:', process.cwd());
    console.log('Processed Env:', {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'Present (Hidden)' : 'Missing'
    });
} else {
    console.log('🚀 Supabase client initializing with:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
