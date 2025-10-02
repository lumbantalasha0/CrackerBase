// Netlify Function to handle GET /api/ingredients and POST /api/ingredients
import { storage } from '../../server/storage.js';

export const handler = async function (event, context) {
  try {
    if (event.httpMethod === 'GET') {
      try {
        const items = await storage.getIngredients();
        return { statusCode: 200, body: JSON.stringify(items) };
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
      }
    }

    if (event.httpMethod === 'POST') {
      if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
      }

      const { name, multiplier } = payload;
      if (!name || name.trim() === '') return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };
      if (multiplier == null || isNaN(Number(multiplier))) return { statusCode: 400, body: JSON.stringify({ error: 'multiplier must be numeric' }) };

      try {
        const created = await storage.createIngredient({ name: String(name).trim(), multiplier: Number(multiplier), unit: undefined });
        return { statusCode: 200, body: JSON.stringify(created) };
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
      }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
