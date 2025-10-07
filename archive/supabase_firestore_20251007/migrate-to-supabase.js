import fs from 'fs';
import { Client } from '@neondatabase/serverless';

export const handler = async () => {
  try {
  const conn = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!conn) return { statusCode: 400, body: JSON.stringify({ error: 'NETLIFY_DATABASE_URL or DATABASE_URL not set' }) };
  const sql = new Client({ connectionString: conn });
  // connect not required for serverless client; we use sql.query directly

    const fallbackPath = '/tmp/netlify-fallback.json';
    if (!fs.existsSync(fallbackPath)) {
      return { statusCode: 200, body: JSON.stringify({ migrated: 0, message: 'No fallback file found' }) };
    }

    const raw = fs.readFileSync(fallbackPath, 'utf8');
    const obj = JSON.parse(raw || '{}');
    const results = {};

    const upsertCollection = async (colName, items) => {
      if (!items || !Array.isArray(items) || items.length === 0) return 0;
      let count = 0;
      for (const it of items) {
        try {
          // Basic insert: map object keys to columns (assumes object keys match column names)
          const cols = Object.keys(it || {});
          if (cols.length === 0) continue;
          const vals = cols.map((_, i) => `$${i+1}`).join(', ');
          const sqlText = `INSERT INTO public.${colName} (${cols.join(',')}) VALUES (${vals})`;
          const params = cols.map(c => it[c]);
          await sql.query(sqlText, params);
          count++;
        } catch (e) {
          console.error('upsert exception', e && e.toString ? e.toString() : String(e));
        }
      }
      return count;
    };

  results.customers = await upsertCollection('customers', obj.customers);
  results.inventory_movements = await upsertCollection('inventory_movements', obj.inventoryMovements);
  results.sales = await upsertCollection('sales', obj.sales);
  results.ingredients = await upsertCollection('ingredients', obj.ingredients);

  return { statusCode: 200, body: JSON.stringify({ ok: true, results }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: (e && e.toString && e.toString()) || String(e) }) };
  }
};
