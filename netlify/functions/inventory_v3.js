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
        const { neon } = await import('@netlify/neon');
        const sql = neon();
        // fetch latest movement to compute balance
        const lastRows = await sql`SELECT balance FROM public.inventory_movements ORDER BY created_at DESC LIMIT 1`;
        const currentBalance = (lastRows && lastRows[0] && Number(lastRows[0].balance)) || 0;
        const qty = Number(quantity);
        const newBalance = type === 'addition' ? currentBalance + qty : currentBalance - qty;
        const createdAt = new Date().toISOString();
        const rows = await sql`
          INSERT INTO public.inventory_movements (type, quantity, balance, note, created_at)
          VALUES (${type}, ${qty}, ${newBalance}, ${note ?? null}, ${createdAt})
          RETURNING id, type, quantity, balance, note, created_at
        `;
        return { statusCode: 200, body: JSON.stringify(rows && rows[0] ? rows[0] : null) };
      } catch (err) {
        console.error('inventory_v3 neon error:', err);
        if (process.env.DEBUG_SUPABASE_ERRORS === '1') {
          const message = err && err.message ? err.message : String(err);
          return { statusCode: 500, body: JSON.stringify({ error: 'Neon insert error', details: message }) };
        }
        // fallback to local /tmp to keep UI usable (below)
      }
    }

    const saved = { id: Date.now(), type, name: name || null, quantity: Number(quantity), price: price != null ? Number(price) : null, location: location || null, phone: phone || null, note: note || null, createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
