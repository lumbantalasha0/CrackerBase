export const handler = async () => {
  try {
    // Debug: log whether NETLIFY_DATABASE_URL is present (do NOT log the value)
    // This will appear in Netlify function logs and help identify connectivity issues.
    // eslint-disable-next-line no-console
    console.log('DEBUG: NETLIFY_DATABASE_URL present?', !!process.env.NETLIFY_DATABASE_URL);
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
        // Log full stack for debugging
        // eslint-disable-next-line no-console
        console.error('DEBUG: debug-supabase neon error', err && err.stack ? err.stack : err);
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: (err && err.message) || String(err) }) };
      }
    }

    // Fallback: indicate Supabase not configured for this endpoint
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'NETLIFY_DATABASE_URL not set' }) };
  } catch (e) {
    // Log unexpected errors with stack
    // eslint-disable-next-line no-console
    console.error('DEBUG: debug-supabase unexpected error', e && e.stack ? e.stack : e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: (e && e.message) || String(e) }) };
  }
};
