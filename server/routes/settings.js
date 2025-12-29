import { Router } from 'express';
import { run, getSettings, getSetting } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';
import { encrypt, decrypt, isEncrypted } from '../crypto.js';

const router = Router();

// Broadcast function will be injected from main server
let broadcast = () => { };
export const setBroadcast = (fn) => { broadcast = fn; };

// Sensitive settings that should be encrypted
const SENSITIVE_KEYS = [];

// Sensitive settings that should be masked in responses
const MASKED_KEYS = [];

// Get all settings (public - for app config)
router.get('/', (req, res) => {
    const settings = getSettings();

    // Mask sensitive settings for public endpoint
    const publicSettings = { ...settings };
    MASKED_KEYS.forEach(key => {
        if (publicSettings[key]) {
            // Show masked value to indicate it's set
            publicSettings[key] = publicSettings[key].startsWith('XXX')
                ? publicSettings[key]  // Placeholder, show as-is
                : '••••••••••••••••••••••••••••••••••••••••••••';
        }
    });

    res.json({ settings: publicSettings });
});

// Update settings (admin only)
router.put('/', requireAdmin, (req, res) => {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(settings)) {
        let valueToStore = String(value);

        // Check if this is a sensitive masked value
        if (SENSITIVE_KEYS.includes(key) && value && value.startsWith('•')) {
            console.log(`⏭️ Skipping update for masked key: ${key}`);
            continue;
        }

        // Encrypt sensitive values
        if (SENSITIVE_KEYS.includes(key) && value) {
            // Only encrypt if it's a new value (not the masked placeholder)
            if (!value.startsWith('XXX')) {
                valueToStore = encrypt(valueToStore);
                console.log(`🔐 Encrypted ${key}`);
            }
        }

        run(
            `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
            [key, valueToStore, valueToStore]
        );
    }

    const updatedSettings = getSettings();

    // Mask sensitive settings in response
    const responseSettings = { ...updatedSettings };
    MASKED_KEYS.forEach(key => {
        if (responseSettings[key] && !responseSettings[key].startsWith('XXX')) {
            responseSettings[key] = '••••••••••••••••••••••••••••••••••••••••••••';
        }
    });

    // Broadcast settings update to all clients
    broadcast({ type: 'settings_updated', settings: responseSettings });

    res.json({ settings: responseSettings });
});

export default router;
