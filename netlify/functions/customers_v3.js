export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    let payload; try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
    const { name, phone, location } = payload;
    if (!name || !String(name).trim()) return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };

    // Prefer Neon/Postgres when configured
    if (process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL) {
      try {
        const { Client } = await import('@neondatabase/serverless');
        const sql = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL });
        const payloadRow = { name: String(name).trim(), phone: phone ? String(phone).trim() : null, location: location ? String(location).trim() : null };
        const cols = Object.keys(payloadRow);
        const vals = cols.map((_, i) => `$${i+1}`).join(', ');
        const params = cols.map(c => payloadRow[c]);
        const sqlText = `INSERT INTO public.customers (${cols.join(',')}, created_at) VALUES (${vals}, now()) RETURNING *`;
        const result = await sql.query(sqlText, params);
        const rows = result && result.rows ? result.rows : [];
        return { statusCode: 200, body: JSON.stringify(rows[0]) };
      } catch (err) {
        console.error('customers_v3 neon error:', err);
        // fallback to local /tmp on error to keep UI usable
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
          const message = err && err.message ? err.message : String(err);
          return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) };
        }
      }
    }

    if (process.env.USE_FIRESTORE === '1') {
      try {
        const adminMod = await import('firebase-admin');
        const admin = adminMod.default || adminMod;
        if (!admin.apps || admin.apps.length === 0) {
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_B64;
          if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
          let svc;
          try { svc = JSON.parse(raw); } catch (e) { try { svc = JSON.parse(Buffer.from(raw.trim(), 'base64').toString('utf8')); } catch (e2) { throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON (plain or base64)'); } }
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
