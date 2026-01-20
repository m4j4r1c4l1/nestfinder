
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '../../debug_logs.txt');

import { requireAdmin, requireUser } from '../middleware/auth.js';
import { getSetting, all, run, get } from '../database.js';

// Middleware: Check if Debug Mode is globally enabled
const requireDebugMode = (req, res, next) => {
    // Exception: Crash reports are always allowed
    if (req.body && req.body.isCrash) {
        return next();
    }

    const isEnabled = getSetting('debug_mode_enabled') === 'true';
    if (!isEnabled) {
        return res.status(403).json({
            error: 'Debug Mode is disabled',
            code: 'GLOBAL_DEBUG_DISABLED'
        });
    }
    next();
};

// ==========================================
// ADMIN ENDPOINTS (Require Admin Auth)
// ==========================================

// GET /api/debug/users - List users with debug status
router.get('/users', requireAdmin, (req, res) => {
    try {
        const users = all(`
            SELECT 
                u.id, 
                u.nickname, 
                u.debug_enabled, 
                u.debug_level,
                u.debug_last_seen,
                u.last_active,
                (SELECT COUNT(*) FROM client_logs WHERE user_id = u.id) as log_count
            FROM users u
            ORDER BY u.debug_enabled DESC, u.last_active DESC
            LIMIT 5000
        `);
        res.json({ users });
    } catch (err) {
        console.error('Error fetching debug users:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/debug/users/:id/toggle - Toggle debug mode for user
router.post('/users/:id/toggle', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const user = get('SELECT debug_enabled FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newState = user.debug_enabled ? 0 : 1;
        run('UPDATE users SET debug_enabled = ? WHERE id = ?', [newState, id]);

        // ASAP Sync: Broadcast update
        const wss = req.app?.get('wss');
        if (wss) {
            const payload = JSON.stringify({ type: 'debug_update', userId: id, enabled: newState === 1 });
            wss.clients.forEach(client => {
                if (client.readyState === 1) client.send(payload);
            });
        }

        res.json({
            success: true,
            debug_enabled: newState === 1,
            message: newState ? 'Debug enabled for user' : 'Debug disabled for user'
        });
    } catch (err) {
        console.error('Error toggling debug:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/debug/users/:id/level - Set debug level for user
router.post('/users/:id/level', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { level } = req.body;

        if (!['default', 'aggressive', 'paranoic'].includes(level)) {
            return res.status(400).json({ error: 'Invalid debug level' });
        }

        const user = get('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        run('UPDATE users SET debug_level = ? WHERE id = ?', [level, id]);

        // ASAP Sync: Broadcast update
        const wss = req.app?.get('wss');
        if (wss) {
            const payload = JSON.stringify({ type: 'debug_update', userId: id, level });
            wss.clients.forEach(client => {
                if (client.readyState === 1) client.send(payload);
            });
        }

        res.json({
            success: true,
            debug_level: level,
            message: `Debug level set to ${level}`
        });
    } catch (err) {
        console.error('Error setting debug level:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/debug/users/:id/logs - Get logs for specific user
router.get('/users/:id/logs', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const logs = all('SELECT * FROM client_logs WHERE user_id = ? ORDER BY uploaded_at ASC', [id]);

        // Combine all log entries
        const allLogs = logs.map(entry => {
            try {
                return JSON.parse(entry.logs);
            } catch {
                return [entry.logs];
            }
        }).flat();

        res.json({
            user_id: id,
            log_count: allLogs.length,
            logs: allLogs,
            entries: logs.length
        });
    } catch (err) {
        console.error('Error fetching user logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/debug/users/:id/logs/download - Download logs as text file
router.get('/users/:id/logs/download', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const user = get('SELECT nickname FROM users WHERE id = ?', [id]);
        const logs = all('SELECT * FROM client_logs WHERE user_id = ? ORDER BY uploaded_at ASC', [id]);

        const header = `================================================================================
DEBUG LOGS EXPORT
User:      ${user?.nickname || 'Anonymous'}
UserID:    ${id}
Generated: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Paris' })} (CET/CEST)
================================================================================\n\n`;

        let content = header;

        logs.forEach((entry, i) => {
            content += `--------------------------------------------------------------------------------\n`;
            content += `UPLOAD #${i + 1}\n`;
            content += `Timestamp: ${new Date(entry.uploaded_at).toLocaleString('en-GB', { timeZone: 'Europe/Paris' })} (CET/CEST)\n`;
            content += `Platform:  ${entry.platform || 'Unknown'}\n`;
            content += `--------------------------------------------------------------------------------\n`;

            try {
                const parsed = JSON.parse(entry.logs);
                // Format each line for better readability
                content += parsed.map(line => {
                    // Try to align timestamps strictly if possible, otherwise just output content
                    return line;
                }).join('\n') + '\n';
            } catch {
                content += entry.logs + '\n';
            }
            content += '\n\n';
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="debug_${user?.nickname || id}_${Date.now()}.txt"`);
        res.send(content);
    } catch (err) {
        console.error('Error downloading logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/debug/users/:id/logs - Clear logs for user
router.delete('/users/:id/logs', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        run('DELETE FROM client_logs WHERE user_id = ?', [id]);
        res.json({ success: true, message: 'Logs cleared' });
    } catch (err) {
        console.error('Error clearing logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/debug/logs - Clear ALL logs
router.delete('/logs', requireAdmin, (req, res) => {
    try {
        run('DELETE FROM client_logs');
        res.json({ success: true, message: 'All logs cleared' });
    } catch (err) {
        console.error('Error clearing all logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CLIENT ENDPOINTS (Require Debug Mode)
// ==========================================

// GET /api/debug/status - Check if debug is enabled for current user
router.get('/status', requireUser, (req, res) => {
    try {
        const globalEnabled = getSetting('debug_mode_enabled') === 'true';
        const user = get('SELECT debug_enabled, debug_level FROM users WHERE id = ?', [req.user.id]);

        res.json({
            global_enabled: globalEnabled,
            user_enabled: user?.debug_enabled === 1,
            debug_level: user?.debug_level || 'default',
            active: globalEnabled && user?.debug_enabled === 1
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/debug/logs - Upload logs from client
// We used to only use requireDebugMode, but now we allow crashes to bypass everything
// and regular logs to be authenticated.
router.post('/logs', (req, res, next) => {
    // If it's a crash report, bypass global debug check and user check
    if (req.body && req.body.isCrash) {
        return next();
    }
    // Otherwise, require global debug mode
    requireDebugMode(req, res, next);
}, (req, res, next) => {
    // If it's a crash report, bypass user check
    if (req.body && req.body.isCrash) {
        return next();
    }
    // Otherwise, require authenticated user
    requireUser(req, res, next);
}, (req, res) => {
    try {
        const { logs, platform, userAgent, userId, isCrash } = req.body;

        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({ error: 'No logs provided' });
        }

        if (logs.length > 500) {
            return res.status(400).json({ error: 'Payload too large: Max 500 logs per request' });
        }

        // --- Handling Authenticated User Logs ---
        if (!isCrash && req.user) {
            // Verify body userId matches token userId to prevent spoofing
            if (userId && userId !== req.user.id) {
                return res.status(403).json({
                    error: 'User ID mismatch',
                    code: 'USER_ID_MISMATCH'
                });
            }

            // Check if user has debug enabled specifically
            if (req.user.debug_enabled !== 1) {
                return res.status(403).json({
                    error: 'Debug not enabled for this user',
                    code: 'USER_DEBUG_DISABLED'
                });
            }

            // Store in database
            run(`
                INSERT INTO client_logs (user_id, logs, platform, user_agent)
                VALUES (?, ?, ?, ?)
            `, [req.user.id, JSON.stringify(logs), platform || null, userAgent || null]);

            // Update last seen
            run('UPDATE users SET debug_last_seen = CURRENT_TIMESTAMP WHERE id = ?', [req.user.id]);

            console.log(`[DEBUG] Received ${logs.length} logs from ${req.user.id} (${req.user.nickname}).`);
        }
        // --- Handling Crash Reports (potentially anonymous) ---
        else if (isCrash) {
            const crashUserId = userId || req.user?.id || 'anonymous';

            // Store crashes even if debug is off
            run(`
                INSERT INTO client_logs (user_id, logs, platform, user_agent)
                VALUES (?, ?, ?, ?)
            `, [crashUserId, JSON.stringify(logs), platform || null, userAgent || null]);

            console.log(`[CRASH] Received crash report from ${crashUserId}.`);
        }

        // Also append to legacy file for backwards compatibility
        const timestamp = new Date().toISOString();
        const logEntry = `\n--- LOG ENTRY [${timestamp}] ---\nUser: ${req.user?.id || userId || 'Unknown'}\nPlatform: ${platform || 'Unknown'}\nType: ${isCrash ? 'CRASH' : 'DEBUG'}\n${logs.join('\n')}\n----------------------------\n`;
        fs.appendFileSync(LOG_FILE, logEntry);

        res.json({ success: true, stored: logs.length });
    } catch (err) {
        console.error('Error writing debug logs:', err);
        res.status(500).json({ error: 'Failed to save logs' });
    }
});

// GET /api/debug/download - Download legacy log file (Admin only)
router.get('/download', requireAdmin, (req, res) => {
    try {
        if (fs.existsSync(LOG_FILE)) {
            res.download(LOG_FILE, 'debug_logs.txt');
        } else {
            res.status(404).send('No legacy logs found.');
        }
    } catch (err) {
        console.error('Error sending log file:', err);
        res.status(500).send('Error downloading logs');
    }
});

// GET /api/debug/dump/tables - Dump broadcast_views and notifications (Admin only)
router.get('/dump/tables', requireAdmin, (req, res) => {
    try {
        const broadcastViews = all('SELECT * FROM broadcast_views ORDER BY created_at DESC');
        const notifications = all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
        const users = all('SELECT id, nickname, created_at, debug_enabled FROM users ORDER BY created_at DESC LIMIT 20');

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
