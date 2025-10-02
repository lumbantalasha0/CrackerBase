// Netlify Function to handle POST /api/sales
import { storage } from '../../server/storage.js';

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

    try {
      const created = await storage.createSale({ customerId: customerId ?? undefined, customerName: undefined, quantity: Number(quantity), pricePerUnit: Number(pricePerUnit), status: undefined });
      return { statusCode: 200, body: JSON.stringify(created) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
