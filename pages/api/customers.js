// pages/api/customers.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    // echo back the posted JSON
    return res.status(200).json({ ok: true, message: 'customers API live', received: req.body });
  }
  // Accept GET too so you can test in a browser
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'customers API (GET) live — use POST to send data' });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method Not Allowed');
}
