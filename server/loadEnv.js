/**
 * Must be imported first from server/index.js so process.env is populated before
 * any route module loads server/config/supabaseClient.js (ESM runs static imports
 * before the rest of index.js).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env'), override: true });