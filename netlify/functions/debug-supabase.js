import { neon } from '@netlify/neon';

export const handler = async () => {
  try {
    // Prefer Neon/Postgres when NETLIFY_DATABASE_URL is set
    if (process.env.NETLIFY_DATABASE_URL) {
      try {
        const sql = neon();
        const timestamp = new Date().toISOString();
        const rows = await sql`INSERT INTO public.debug_table (note, created_at) VALUES ('debug', ${timestamp}) RETURNING id, note, created_at`;
        const data = rows && rows[0] ? rows[0] : null;
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
