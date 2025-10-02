// Netlify Function to handle POST /api/sales
export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    }

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    // Basic validation: customerId, quantity, pricePerUnit
    const { customerId, quantity, pricePerUnit } = payload;
    if (!customerId || !quantity || !pricePerUnit) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

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

        // create sale
        const ref = await db.collection('sales').add({ customerId: customerId ?? null, customerName: null, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), totalPrice: (Number(pricePerUnit) * Number(quantity)), status: 'completed', createdAt: new Date().toISOString() });
        const doc = await ref.get();

        // Also create inventory movement for sale
        await db.collection('inventoryMovements').add({ type: 'sale', quantity: Number(quantity), note: `Sale to ${customerId ?? 'Customer'}`, createdAt: new Date().toISOString(), balance: null });

        return { statusCode: 200, body: JSON.stringify({ id: doc.id, ...doc.data() }) };
      } catch (err) {
        console.error('sales firestore error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
      }
    }

    // fallback ephemeral
    try {
      const saved = {
        id: Date.now(),
        customerId,
        quantity: Number(quantity),
        pricePerUnit: Number(pricePerUnit),
        createdAt: new Date().toISOString(),
      };
      return { statusCode: 200, body: JSON.stringify(saved) };
    } catch (err) {
      console.error('sales fallback error:', err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
