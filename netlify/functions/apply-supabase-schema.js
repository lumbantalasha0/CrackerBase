import { neon } from '@netlify/neon';
import fs from 'fs/promises';
import path from 'path';

// Safety guard: require explicit env var to be set in Netlify to allow running this.
// Set ALLOW_SCHEMA_APPLY=1 in your Netlify site envs to enable.
export const handler = async () => {
  try {
    if (process.env.ALLOW_SCHEMA_APPLY !== '1') {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Schema apply not allowed. Set ALLOW_SCHEMA_APPLY=1 to enable.' }) };
    }

    // Ensure a DB connection string is available
    if (!process.env.NETLIFY_DATABASE_URL) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'NETLIFY_DATABASE_URL not set' }) };
    }

    // Read the SQL file from the repository
    const sqlPath = path.resolve(process.cwd(), 'supabase', 'ensure_tables.sql');
    const sqlText = await fs.readFile(sqlPath, 'utf8');

    const sql = neon(); // uses NETLIFY_DATABASE_URL automatically

    // Run the full SQL. neon exposes a .query() method on the client which accepts raw SQL.
    // (If your version of @netlify/neon differs, adjust accordingly.)
    const result = await sql.query(sqlText);

    return { statusCode: 200, body: JSON.stringify({ ok: true, result }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: (err && err.message) || String(err) }) };
  }
};
