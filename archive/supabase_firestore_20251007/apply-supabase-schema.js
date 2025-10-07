import fs from 'fs/promises';
import path from 'path';

// Use the neondatabase serverless client which is present in package.json
import { createClient } from '@neondatabase/serverless';

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

  // Read the SQL file from the repository (this repo kept a legacy path)
  const sqlPath = path.resolve(process.cwd(), 'supabase', 'ensure_tables.sql');
    const sqlText = await fs.readFile(sqlPath, 'utf8');

  const sql = createClient({ connectionString: process.env.NETLIFY_DATABASE_URL });
  // Run the full SQL using a simple query
  const result = await sql.query(sqlText);

    return { statusCode: 200, body: JSON.stringify({ ok: true, result }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: (err && err.message) || String(err) }) };
  }
};
