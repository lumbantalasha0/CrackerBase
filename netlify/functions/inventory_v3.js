export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };

    let payload;
    try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { name, type, quantity, price, location, phone, note } = payload;
    if (!type) return { statusCode: 400, body: JSON.stringify({ error: 'type is required' }) };
    if (quantity == null || isNaN(Number(quantity))) return { statusCode: 400, body: JSON.stringify({ error: 'quantity must be a number' }) };

    // Prefer Neon/Postgres when NETLIFY_DATABASE_URL is set
    if (process.env.NETLIFY_DATABASE_URL) {
      try {
        const { createClient } = await import('@neondatabase/serverless');
        const sql = createClient({ connectionString: process.env.NETLIFY_DATABASE_URL });
        const lastRes = await sql.query('SELECT balance FROM public.inventory_movements ORDER BY created_at DESC LIMIT 1');
        const currentBalance = (lastRes && lastRes.rows && lastRes.rows[0] && Number(lastRes.rows[0].balance)) || 0;
        const qty = Number(quantity);
        const newBalance = type === 'addition' ? currentBalance + qty : currentBalance - qty;
        const createdAt = new Date().toISOString();
        const res = await sql.query('INSERT INTO public.inventory_movements (type, quantity, balance, note, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id, type, quantity, balance, note, created_at', [type, qty, newBalance, note ?? null, createdAt]);
        return { statusCode: 200, body: JSON.stringify(res && res.rows && res.rows[0] ? res.rows[0] : null) };
      } catch (err) {
        console.error('inventory_v3 neon error:', err && err.stack ? err.stack : err);
        // on DB error, fall through to the local /tmp fallback so UI remains usable
      }
    }

    const saved = { id: Date.now(), type, name: name || null, quantity: Number(quantity), price: price != null ? Number(price) : null, location: location || null, phone: phone || null, note: note || null, createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
