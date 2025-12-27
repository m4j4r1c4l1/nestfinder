import { Router } from 'express';
import { run, getSettings } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Broadcast function will be injected from main server
let broadcast = () => { };
export const setBroadcast = (fn) => { broadcast = fn; };

// Get all settings (public - for app config)
router.get('/', (req, res) => {
    const settings = getSettings();
    res.json({ settings });
});

// Update settings (admin only)
router.put('/', requireAdmin, (req, res) => {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(settings)) {
        run(
            `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
            [key, String(value), String(value)]
        );
    }

    const updatedSettings = getSettings();

    // Broadcast settings update to all clients
    broadcast({ type: 'settings_updated', settings: updatedSettings });

    res.json({ settings: updatedSettings });
});

export default router;
