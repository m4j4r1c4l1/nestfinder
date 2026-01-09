
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '../../debug_logs.txt');

// POST /api/debug/logs - Append logs
router.post('/logs', (req, res) => {
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
router.get('/download', (req, res) => {
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

// GET /api/debug/simulate-update - Force a broadcast with incremented stats to prove UI animation
// (Removed after verifying animation logic)

export default router;
