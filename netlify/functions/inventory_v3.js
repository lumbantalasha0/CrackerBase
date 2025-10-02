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
          if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
          const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message, stack }) };
      }
    }

    const saved = { id: Date.now(), type, name: name || null, quantity: Number(quantity), price: price != null ? Number(price) : null, location: location || null, phone: phone || null, note: note || null, createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
