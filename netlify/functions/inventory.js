// Simple Netlify Function to accept POST /api/inventory
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

    // Build saved object (in a real function you'd persist this to a DB)
    const saved = {
      id: Date.now(),
      type,
      name: name || null,
      quantity: Number(quantity),
      price: price != null ? Number(price) : null,
      location: location || null,
      phone: phone || null,
      note: note || null,
      createdAt: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(saved),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
