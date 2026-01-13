
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '../../debug_logs.txt');

import { requireAdmin } from '../middleware/auth.js';
import { getSetting, all } from '../database.js';

// Middleware: Check if Debug Mode is enabled
const requireDebugMode = (req, res, next) => {
    const isEnabled = getSetting('debug_mode_enabled') === 'true';
    if (!isEnabled) {
        return res.status(403).json({ error: 'Debug Mode is disabled' });
    }
    next();
};

// POST /api/debug/logs - Append logs
// Publicly accessible BUT only when Debug Mode is globally enabled
router.post('/logs', requireDebugMode, (req, res) => {
    try {
        const { logs, platform, userAgent } = req.body;
        const timestamp = new Date().toISOString();

        const logEntry = `\n--- LOG ENTRY [${timestamp}] ---\nPlatform: ${platform || 'Unknown'}\nUA: ${userAgent || 'Unknown'}\n${logs.join('\n')}\n----------------------------\n`;

        fs.appendFileSync(LOG_FILE, logEntry);
        console.log(`[DEBUG] Received ${logs.length} logs from client.`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing debug logs:', err);
        res.status(500).json({ error: 'Failed to save logs' });
    }
});

// GET /api/debug/download - Download logs
// Protected: Requires Admin OR Debug Mode (if we want to allow easy access, but usually Admin only is safer for downloading)
// Let's restrict to Admin for security, as typically only devs/admins need to read them.
router.get('/download', requireAdmin, (req, res) => {
    try {
        if (fs.existsSync(LOG_FILE)) {
            res.download(LOG_FILE, 'swipe_debug_logs.txt');
        } else {
            res.status(404).send('No logs found.');
        }
    } catch (err) {
        console.error('Error sending log file:', err);
        res.status(500).send('Error downloading logs');
    }
});

// GET /api/debug/dump/tables - Dump broadcast_views and notifications
// CRITICAL SECURITY: Requires Admin Authentication explicitly. 
// Even if debug mode is on, public shouldn't see PII.
router.get('/dump/tables', requireAdmin, (req, res) => {
    try {
        const broadcastViews = all('SELECT * FROM broadcast_views ORDER BY created_at DESC');
        const notifications = all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
        const users = all('SELECT id, nickname, created_at FROM users ORDER BY created_at DESC LIMIT 20');

        res.json({
            meta: {
                timestamp: new Date().toISOString(),
                viewCount: broadcastViews.length,
                notifCount: notifications.length
            },
            broadcastViews,
            notifications,
            users
        });
    } catch (err) {
        console.error('Dump error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
