// Netlify Function to handle GET /api/ingredients and POST /api/ingredients
export const handler = async function (event, context) {
  try {
    if (event.httpMethod === 'GET') {
      // In production you'd fetch from DB; return an empty array placeholder or mimic server
      return { statusCode: 200, body: JSON.stringify([]) };
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

      const saved = { id: Date.now(), name: String(name).trim(), multiplier: Number(multiplier), createdAt: new Date().toISOString() };
      return { statusCode: 200, body: JSON.stringify(saved) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
