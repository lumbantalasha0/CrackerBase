import { Client } from '@neondatabase/serverless';

let sql: Client | null = null;
let dbEnabled = false;

const conn = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || '';

if (conn) {
  sql = new Client({ connectionString: conn });
  dbEnabled = true;
  // eslint-disable-next-line no-console
  console.log('Neon/Postgres client initialized (server)');
} else {
  // eslint-disable-next-line no-console
  console.log('Database not configured (NETLIFY_DATABASE_URL or DATABASE_URL missing)');
}

async function dbQuery(text: string, params: any[] = []) {
  if (!sql) throw new Error('Database client not initialized');
  const res = await sql.query(text, params);
  // Node/Postgres style: return rows if present
  // The neondatabase serverless client returns an object with 'rows'
  return (res && (res as any).rows) ? (res as any).rows : res;
}

export { sql, dbEnabled, dbQuery };
