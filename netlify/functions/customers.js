// Simple Netlify Function to accept POST /api/customers
import { storage } from '../../server/storage.js';

export const handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
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

    const { name, phone, location } = payload;
    if (!name || !String(name).trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };
    }

    try {
      const created = await storage.createCustomer({ name: String(name).trim(), phone: phone ? String(phone).trim() : undefined, businessName: undefined, location: location ? String(location).trim() : undefined });
      return { statusCode: 200, body: JSON.stringify(created) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
