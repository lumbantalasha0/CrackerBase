export const handler = async function (event, context) {
  try {
    if (event.httpMethod === 'GET') {
      try {
        if (process.env.USE_FIRESTORE === '1') {
          const adminMod = await import('firebase-admin');
          const admin = adminMod.default || adminMod;
          if (!admin.apps || admin.apps.length === 0) {
            if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
            const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({ credential: admin.credential.cert(svc) });
          }
          const db = admin.firestore();
          const snap = await db.collection('ingredients').orderBy('name').get();
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          return { statusCode: 200, body: JSON.stringify(items) };
        }
        return { statusCode: 200, body: JSON.stringify([]) };
  } catch (err) { console.error('ingredients_v3 GET error:', err); const message = err && err.message ? err.message : String(err); return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) }; }
    }

    if (event.httpMethod === 'POST') {
      if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
      let payload; try { payload = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
      const { name, multiplier } = payload;
      if (!name || name.trim() === '') return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };
      if (multiplier == null || isNaN(Number(multiplier))) return { statusCode: 400, body: JSON.stringify({ error: 'multiplier must be numeric' }) };
      try {
        if (process.env.USE_FIRESTORE === '1') {
          const adminMod = await import('firebase-admin');
          const admin = adminMod.default || adminMod;
          if (!admin.apps || admin.apps.length === 0) {
            if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
            const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({ credential: admin.credential.cert(svc) });
          }
          const db = admin.firestore();
          const ref = await db.collection('ingredients').add({ name: String(name).trim(), multiplier: Number(multiplier), unit: 'g', createdAt: new Date().toISOString() });
          const doc = await ref.get();
          return { statusCode: 200, body: JSON.stringify({ id: doc.id, ...doc.data() }) };
        }
        const saved = { id: Date.now(), name: String(name).trim(), multiplier: Number(multiplier), createdAt: new Date().toISOString() };
        return { statusCode: 200, body: JSON.stringify(saved) };
      } catch (err) { console.error('ingredients_v3 POST error:', err); const message = err && err.message ? err.message : String(err); const stack = err && err.stack ? err.stack : null;
        const unauth = (message && /unauth/i.test(message)) || (stack && /unauth/i.test(stack)) || (message && message.startsWith('16 '));
        if (unauth) {
          try {
            const fs = await import('fs');
            const path = '/tmp/netlify-fallback.json';
            let data = { ingredients: [] };
            if (fs.existsSync(path)) {
              const raw = fs.readFileSync(path, 'utf8');
              data = JSON.parse(raw || '{}');
              if (!data.ingredients) data.ingredients = [];
            }
            const saved = { id: `local-${Date.now()}`, name: String(name).trim(), multiplier: Number(multiplier), unit: 'g', createdAt: new Date().toISOString() };
            data.ingredients.unshift(saved);
            fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
            return { statusCode: 200, body: JSON.stringify(saved) };
          } catch (fsErr) {
            console.error('ingredients_v3 fallback write error:', fsErr);
            return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) };
          }
        }
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', details: message }) };
      }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) { return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }; }
};
