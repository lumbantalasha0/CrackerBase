export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    let payload; try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
    const { name, phone, location } = payload;
    if (!name || !String(name).trim()) return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };

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
        const ref = await db.collection('customers').add({ name: String(name).trim(), phone: phone ? String(phone).trim() : null, location: location ? String(location).trim() : null, createdAt: new Date().toISOString() });
        const doc = await ref.get();
        return { statusCode: 200, body: JSON.stringify({ id: doc.id, ...doc.data() }) };
  } catch (err) {
    console.error('customers_v3 firestore error:', err);
  const message = err && err.message ? err.message : String(err);
  const stack = err && err.stack ? err.stack : null;
  const unauth = (message && /unauth/i.test(message)) || (stack && /unauth/i.test(stack)) || (message && message.startsWith('16 '));
  if (unauth) {
      try {
        const fs = await import('fs');
        const path = '/tmp/netlify-fallback.json';
        let data = { customers: [] };
        if (fs.existsSync(path)) {
          const raw = fs.readFileSync(path, 'utf8');
          data = JSON.parse(raw || '{}');
          if (!data.customers) data.customers = [];
        }
        const saved = { id: `local-${Date.now()}`, name: String(name).trim(), phone: phone ? String(phone).trim() : null, location: location ? String(location).trim() : null, createdAt: new Date().toISOString() };
        data.customers.unshift(saved);
        fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
        return { statusCode: 200, body: JSON.stringify(saved) };
      } catch (fsErr) {
        console.error('customers_v3 fallback write error:', fsErr);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) };
      }
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) };
  }
    }

    const saved = { id: Date.now(), name: String(name).trim(), phone: phone ? String(phone).trim() : null, location: location ? String(location).trim() : null, createdAt: new Date().toISOString() };
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) { return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }; }
};
