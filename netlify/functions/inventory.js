// Simple Netlify Function to accept POST /api/inventory
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

    // Basic validation: name, quantity, price, location, phone (some apps may not need all)
    const { name, type, quantity, price, location, phone, note } = payload;

    if (!type) {
      return { statusCode: 400, body: JSON.stringify({ error: 'type is required' }) };
    }

    if (quantity == null || isNaN(Number(quantity))) {
      return { statusCode: 400, body: JSON.stringify({ error: 'quantity must be a number' }) };
    }

    // Persist via shared storage (will use Firestore when enabled, otherwise file-backed MemStorage)
    try {
      const created = await storage.createInventoryMovement({ type, quantity: Number(quantity), note });
      return { statusCode: 200, body: JSON.stringify(created) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
