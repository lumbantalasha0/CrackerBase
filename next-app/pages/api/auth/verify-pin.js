// next-app/pages/api/auth/verify-pin.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    const { pin } = req.body;

    if (pin === '4207') { // your default PIN
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
