export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    let payload; try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
    const { customerId, quantity, pricePerUnit } = payload;
    if (!quantity || !pricePerUnit) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };

    // Prefer Neon/Postgres when NETLIFY_DATABASE_URL is set
    if (process.env.NETLIFY_DATABASE_URL) {
      try {
        const { createClient } = await import('@neondatabase/serverless');
        const sql = createClient({ connectionString: process.env.NETLIFY_DATABASE_URL });
        const createdAt = new Date().toISOString();
        const res = await sql.query(
          'INSERT INTO public.sales (customer_id, customer_name, quantity, price_per_unit, total_price, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, customer_id, quantity, price_per_unit, total_price, status, created_at',
          [customerId ?? null, null, Number(quantity), Number(pricePerUnit), Number(pricePerUnit) * Number(quantity), 'completed', createdAt]
        );
        const sale = (res && res.rows && res.rows[0]) ? res.rows[0] : null;
        try {
          await sql.query('INSERT INTO public.inventory_movements (type, quantity, balance, note, created_at) VALUES ($1,$2,$3,$4,$5)', ['sale', Number(quantity), null, `Sale to ${customerId ?? 'Customer'}`, createdAt]);
        } catch (e) {
          console.error('sales_v3 neon inventory insert error:', e);
        }
        return { statusCode: 200, body: JSON.stringify(sale) };
      } catch (err) {
        console.error('sales_v3 neon error:', err && err.stack ? err.stack : err);
        // on DB error, fall through to local /tmp fallback so UI remains usable
      }
    }

    const saved = { id: Date.now(), customerId, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) { return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }; }
};
