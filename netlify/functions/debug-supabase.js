import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY;
    if (!url || !key) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE not set' }) };
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    // attempt a small write to a debug table `debug_table` (create if missing is left to maintainer)
    const timestamp = new Date().toISOString();
    try {
      const { data, error } = await supabase.from('debug_table').insert({ note: 'debug', created_at: timestamp }).select().limit(1);
      if (error) {
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message || String(error) }) };
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, data: data && data[0] }) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: (e && e.toString && e.toString()) || String(e) }) };
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: (e && e.toString && e.toString()) || String(e) }) };
  }
};
