// Simple Netlify Function to accept POST /api/customers
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

    const saved = {
      id: Date.now(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : null,
      location: location ? String(location).trim() : null,
      createdAt: new Date().toISOString(),
    };

    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
