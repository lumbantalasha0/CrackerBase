import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || process.env.VITE_SUPABASE_ANON || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export { supabase };
