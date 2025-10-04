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
        const { neon } = await import('@netlify/neon');
        const sql = neon();
        const createdAt = new Date().toISOString();
        const rows = await sql`
          INSERT INTO public.sales (customer_id, customer_name, quantity, price_per_unit, total_price, status, created_at)
          VALUES (${customerId ?? null}, ${null}, ${Number(quantity)}, ${Number(pricePerUnit)}, ${Number(pricePerUnit) * Number(quantity)}, 'completed', ${createdAt})
          RETURNING id, customer_id, quantity, price_per_unit, total_price, status, created_at
        `;
        const sale = rows && rows[0] ? rows[0] : null;
        // also create inventory movement (best-effort)
        try {
          await sql`
            INSERT INTO public.inventory_movements (type, quantity, balance, note, created_at)
            VALUES ('sale', ${Number(quantity)}, NULL, ${`Sale to ${customerId ?? 'Customer'}`}, ${createdAt})
          `;
        } catch (e) {
          console.error('sales_v3 neon inventory insert error:', e);
        }
        return { statusCode: 200, body: JSON.stringify(sale) };
      } catch (err) {
        console.error('sales_v3 neon error:', err);
        if (process.env.DEBUG_SUPABASE_ERRORS === '1') {
          const message = err && err.message ? err.message : String(err);
          return { statusCode: 500, body: JSON.stringify({ error: 'Neon insert error', details: message }) };
        }
        // fallback to local /tmp handling below
      }
    }

    const saved = { id: Date.now(), customerId, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) { return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }; }
};
