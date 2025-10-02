// Netlify Function to handle POST /api/export/email
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

    const { pdfBase64, filename } = payload;
    if (!pdfBase64 || !filename) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing pdfBase64 or filename' }) };
    }

    // In production, send email here. For now, just echo back.
    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent (mock)', filename }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
