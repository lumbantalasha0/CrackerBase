import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let supabaseEnabled = false;

// Prefer a SUPABASE_SERVICE_ROLE or SUPABASE_KEY with elevated privileges for server
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY || '';

if (url && key) {
  supabase = createClient(url, key, { auth: { persistSession: false } });
  supabaseEnabled = true;
  // eslint-disable-next-line no-console
  console.log('Supabase client initialized (server)');
} else {
  // eslint-disable-next-line no-console
  console.log('Supabase not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE missing)');
}

export { supabase, supabaseEnabled };
