export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };

    let payload;
    try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { name, type, quantity, price, location, phone, note } = payload;
    if (!type) return { statusCode: 400, body: JSON.stringify({ error: 'type is required' }) };
    if (quantity == null || isNaN(Number(quantity))) return { statusCode: 400, body: JSON.stringify({ error: 'quantity must be a number' }) };

    if (process.env.USE_FIRESTORE === '1') {
      try {
        const adminMod = await import('firebase-admin');
        const admin = adminMod.default || adminMod;
        if (!admin.apps || admin.apps.length === 0) {
          // support FIREBASE_SERVICE_ACCOUNT (raw JSON) or FIREBASE_SERVICE_ACCOUNT_B64 (base64-encoded)
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_B64 || process.env.FIREBASE_SERVICE_ACCOUNT_B64;
          if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
          let svc;
          try { svc = JSON.parse(raw); } catch (e) {
            try { svc = JSON.parse(Buffer.from(raw.trim(), 'base64').toString('utf8')); } catch (e2) { throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON (plain or base64)'); }
          }
          admin.initializeApp({ credential: admin.credential.cert(svc) });
        }
        const db = admin.firestore();
        const snap = await db.collection('inventoryMovements').orderBy('createdAt','desc').limit(1).get();
        let currentBalance = 0;
        if (!snap.empty) { const d = snap.docs[0].data(); currentBalance = Number(d.balance) || 0; }
        const qty = Number(quantity);
        const newBalance = type === 'addition' ? currentBalance + qty : currentBalance - qty;
        const ref = await db.collection('inventoryMovements').add({ type, quantity: qty, balance: newBalance, note: note ?? null, createdAt: new Date().toISOString() });
        const doc = await ref.get();
        return { statusCode: 200, body: JSON.stringify({ id: doc.id, ...doc.data() }) };
      } catch (err) {
        console.error('inventory_v3 firestore error:', err);
        const message = err && err.message ? err.message : String(err);
        const stack = err && err.stack ? err.stack : null;
        // If auth error, fall back to a local /tmp JSON store so UI continues to work
  const unauth = (message && /unauth/i.test(message)) || (stack && /unauth/i.test(stack)) || (message && message.startsWith('16 '));
  if (unauth) {
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
            return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message, stack }) };
          }
        }
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message, stack }) };
      }
    }

    const saved = { id: Date.now(), type, name: name || null, quantity: Number(quantity), price: price != null ? Number(price) : null, location: location || null, phone: phone || null, note: note || null, createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
