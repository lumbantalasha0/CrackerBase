import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY;
    if (!url || !key) return { statusCode: 400, body: JSON.stringify({ error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE not set' }) };
    const supabase = createClient(url, key, { auth: { persistSession: false } });

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
          const { error } = await supabase.from(colName).insert({ ...it }).select();
          if (error) {
            console.error('insert error', colName, error.message || error);
          } else count++;
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
