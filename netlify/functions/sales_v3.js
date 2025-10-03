export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    let payload; try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
    const { customerId, quantity, pricePerUnit } = payload;
    if (!quantity || !pricePerUnit) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };

    // Prefer Supabase when configured
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY)) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY, { auth: { persistSession: false } });
        const payload = { customerId: customerId ?? null, customerName: null, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), totalPrice: Number(pricePerUnit) * Number(quantity), status: 'completed', created_at: new Date().toISOString() };
        const { data, error } = await supabase.from('sales').insert(payload).select().limit(1);
        if (error) throw error;
        // also create inventory movement
        try { await supabase.from('inventory_movements').insert({ type: 'sale', quantity: Number(quantity), note: `Sale to ${customerId ?? 'Customer'}`, created_at: new Date().toISOString(), balance: null }).select(); } catch (e) { console.error('sales_v3 inventory insert error:', e); }
        return { statusCode: 200, body: JSON.stringify(data && data[0]) };
      } catch (err) {
        console.error('sales_v3 supabase error:', err);
        // if debugging enabled, return Supabase error details to the caller
        if (process.env.DEBUG_SUPABASE_ERRORS === '1') {
          const message = err && err.message ? err.message : String(err);
          return { statusCode: 500, body: JSON.stringify({ error: 'Supabase insert error', details: message }) };
        }
        // fallback to local /tmp store on error
        try {
          const fs = await import('fs');
          const path = '/tmp/netlify-fallback.json';
          let data = { sales: [], inventoryMovements: [] };
          if (fs.existsSync(path)) {
            const raw = fs.readFileSync(path, 'utf8');
            data = JSON.parse(raw || '{}');
            if (!data.sales) data.sales = [];
            if (!data.inventoryMovements) data.inventoryMovements = [];
          }
          const saved = { id: `local-${Date.now()}`, customerId: customerId ?? null, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), totalPrice: Number(pricePerUnit) * Number(quantity), status: 'completed', createdAt: new Date().toISOString() };
          data.sales.unshift(saved);
          data.inventoryMovements.unshift({ id: `local-${Date.now()+1}`, type: 'sale', quantity: Number(quantity), note: `Local sale`, createdAt: new Date().toISOString(), balance: null });
          fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
          return { statusCode: 200, body: JSON.stringify(saved) };
        } catch (fsErr) {
          console.error('sales_v3 fallback write error:', fsErr);
          const message = err && err.message ? err.message : String(err);
          return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) };
        }
      }
    }

    const saved = { id: Date.now(), customerId, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) { return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }; }
};
