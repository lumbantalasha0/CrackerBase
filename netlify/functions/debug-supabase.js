import { neon } from '@netlify/neon';

export const handler = async () => {
  try {
    // Prefer Neon/Postgres when NETLIFY_DATABASE_URL is set
    if (process.env.NETLIFY_DATABASE_URL) {
      try {
        const { createClient } = await import('@neondatabase/serverless');
        const sql = createClient({ connectionString: process.env.NETLIFY_DATABASE_URL });
        const timestamp = new Date().toISOString();
        const res = await sql.query('INSERT INTO public.debug_table (note, created_at) VALUES ($1, $2) RETURNING id, note, created_at', ['debug', timestamp]);
        const data = (res && res.rows && res.rows[0]) ? res.rows[0] : null;
        return { statusCode: 200, body: JSON.stringify({ ok: true, data }) };
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: (err && err.message) || String(err) }) };
      }
    }

    // Fallback: indicate Supabase not configured for this endpoint
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'NETLIFY_DATABASE_URL not set' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: (e && e.message) || String(e) }) };
  }
};
