import { Router } from 'express';
import { storage } from './storage';

const router = Router();

const DEFAULT_PIN = '4207';

router.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    let storedPin = await storage.getSetting('app_pin');
    
    if (!storedPin) {
      await storage.setSetting('app_pin', DEFAULT_PIN);
      storedPin = DEFAULT_PIN;
    }

    if (pin === storedPin) {
      return res.json({ success: true });
    }

    return res.status(401).json({ error: 'Invalid PIN' });
  } catch (error) {
    console.error('PIN verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/auth/change-pin', async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    
    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required' });
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    let storedPin = await storage.getSetting('app_pin');
    
    if (!storedPin) {
      await storage.setSetting('app_pin', DEFAULT_PIN);
      storedPin = DEFAULT_PIN;
    }

    if (currentPin !== storedPin) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    await storage.setSetting('app_pin', newPin);
    return res.json({ success: true });
  } catch (error) {
    console.error('PIN change error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
