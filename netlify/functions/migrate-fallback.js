export const handler = async function (event, context) {
  try {
    // Only POST allowed
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

    // attempt to init firebase-admin from FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_B64
    const adminMod = await import('firebase-admin');
    const admin = adminMod.default || adminMod;
    if (!admin.apps || admin.apps.length === 0) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64 ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8') : process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) return { statusCode: 400, body: JSON.stringify({ error: 'No FIREBASE_SERVICE_ACCOUNT provided' }) };
      const svc = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
    }

    const db = admin.firestore();
    const fs = await import('fs');
    const path = '/tmp/netlify-fallback.json';
    if (!fs.existsSync(path)) return { statusCode: 200, body: JSON.stringify({ migrated: 0, message: 'No fallback file found' }) };
    const raw = fs.readFileSync(path, 'utf8');
    const data = JSON.parse(raw || '{}');
    let migrated = 0;
    const results = {};

    if (Array.isArray(data.inventoryMovements) && data.inventoryMovements.length) {
      const col = db.collection('inventoryMovements');
      const ids = [];
      for (const item of data.inventoryMovements) {
        const { id, ...rest } = item;
        const ref = await col.add(rest);
        ids.push(ref.id);
        migrated++;
      }
      results.inventory = ids;
    }

    if (Array.isArray(data.sales) && data.sales.length) {
      const col = db.collection('sales');
      const ids = [];
      for (const item of data.sales) {
        const { id, ...rest } = item;
        const ref = await col.add(rest);
        ids.push(ref.id);
        migrated++;
      }
      results.sales = ids;
    }

    if (Array.isArray(data.customers) && data.customers.length) {
      const col = db.collection('customers');
      const ids = [];
      for (const item of data.customers) {
        const { id, ...rest } = item;
        const ref = await col.add(rest);
        ids.push(ref.id);
        migrated++;
      }
      results.customers = ids;
    }

    if (Array.isArray(data.ingredients) && data.ingredients.length) {
      const col = db.collection('ingredients');
      const ids = [];
      for (const item of data.ingredients) {
        const { id, ...rest } = item;
        const ref = await col.add(rest);
        ids.push(ref.id);
        migrated++;
      }
      results.ingredients = ids;
    }

    return { statusCode: 200, body: JSON.stringify({ migrated, results }) };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Migration failed', details: msg }) };
  }
};
