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

    const saved = {
      id: Date.now(),
      customerId,
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      createdAt: new Date().toISOString(),
    };
    // In production, save to DB here
    return { statusCode: 200, body: JSON.stringify(saved) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
