export default function handler(req, res) {
  const DEFAULT_PIN = '4207';
  const pin = req.body?.pin;

  if (pin === DEFAULT_PIN) {
    return res.status(200).json({ ok: true, message: 'PIN accepted' });
  }
  return res.status(401).json({ ok: false, message: 'Invalid PIN' });
}
