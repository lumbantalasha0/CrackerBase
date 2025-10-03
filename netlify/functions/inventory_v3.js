export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };

    let payload;
    try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { name, type, quantity, price, location, phone, note } = payload;
    if (!type) return { statusCode: 400, body: JSON.stringify({ error: 'type is required' }) };
    if (quantity == null || isNaN(Number(quantity))) return { statusCode: 400, body: JSON.stringify({ error: 'quantity must be a number' }) };

    // Prefer Supabase when configured
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY)) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY, { auth: { persistSession: false } });

        // fetch latest movement to compute balance
        const { data: last, error: lastErr } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(1);
        if (lastErr) throw lastErr;
        const currentBalance = (last && last[0] && Number(last[0].balance)) || 0;
        const qty = Number(quantity);
        const newBalance = type === 'addition' ? currentBalance + qty : currentBalance - qty;
        const payload = { type, quantity: qty, balance: newBalance, note: note ?? null, created_at: new Date().toISOString() };
        const { data, error } = await supabase.from('inventory_movements').insert(payload).select().limit(1);
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify(data && data[0]) };
      } catch (err) {
        console.error('inventory_v3 supabase error:', err);
        // fallback to local /tmp to keep UI usable
        try {
          const fs = await import('fs');
          const path = '/tmp/netlify-fallback.json';
          let data = { inventoryMovements: [] };
          if (fs.existsSync(path)) {
            const raw = fs.readFileSync(path, 'utf8');
            data = JSON.parse(raw || '{}');
            if (!data.inventoryMovements) data.inventoryMovements = [];
          }
          const qty = Number(quantity);
          const saved = { id: `local-${Date.now()}`, type, quantity: qty, balance: null, note: note ?? null, createdAt: new Date().toISOString() };
          data.inventoryMovements.unshift(saved);
          fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
          return { statusCode: 200, body: JSON.stringify(saved) };
        } catch (fsErr) {
          console.error('inventory_v3 fallback write error:', fsErr);
          return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: (err && err.message) || String(err) }) };
        }
      }
    }

    const saved = { id: Date.now(), type, name: name || null, quantity: Number(quantity), price: price != null ? Number(price) : null, location: location || null, phone: phone || null, note: note || null, createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
