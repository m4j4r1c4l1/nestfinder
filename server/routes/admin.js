import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { get, all, run, resetDatabase } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

// Get dashboard stats
router.get('/stats', (req, res) => {
    // Get disk usage (Linux/Mac only, fallback for Windows)
    let disk = null;
    let osDistro = 'Unknown';
    let networkIps = [];

    try {
        // Disk Usage
        const output = execSync('df -k /').toString();
        const lines = output.trim().split('\n');
        if (lines.length >= 2) {
            const parts = lines[1].split(/\s+/);
            if (parts.length >= 6) {
                const total = parseInt(parts[1]) * 1024;
                const used = parseInt(parts[2]) * 1024;
                const free = parseInt(parts[3]) * 1024;
                disk = { total, used, free };
            }
        }
    } catch (err) { }

    try {
        // OS Distro (Try /etc/issue then /etc/os-release)
        try {
            const issue = execSync('head -n 1 /etc/issue').toString().trim();
            // Remove \n, \l and other escape sequences commonly found in /etc/issue
            osDistro = issue.replace(/\\[nl]/g, '').trim();
        } catch (e) {
            // Fallback to pretty name from os-release if issue fails
            const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
            const match = osRelease.match(/PRETTY_NAME="([^"]+)"/);
            if (match) osDistro = match[1];
        }
    } catch (e) {
        // Fallback to standard OS type if file reading fails (e.g. Windows)
        osDistro = `${os.type()} ${os.release()}`;
    }

    try {
        // Network IPs
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Include all IPv4, exclude only localhost (127.0.0.1)
                if (net.family === 'IPv4' && net.address !== '127.0.0.1') {
                    networkIps.push({ name, ip: net.address, internal: net.internal });
                }
            }
        }
    } catch (e) { }

    const stats = {
        totalPoints: get('SELECT COUNT(*) as count FROM points').count,
        pendingPoints: get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['pending']).count,
        confirmedPoints: get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['confirmed']).count,
        deactivatedPoints: get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['deactivated']).count,
        totalUsers: get('SELECT COUNT(*) as count FROM users').count,
        activeUsers: get(`
      SELECT COUNT(*) as count FROM users 
      WHERE datetime(last_active) > datetime('now', '-7 days')
    `).count,
        todaySubmissions: get(`
      SELECT COUNT(*) as count FROM points 
      WHERE date(created_at) = date('now')
    `).count,
        todayActions: get(`
      SELECT COUNT(*) as count FROM logs 
      WHERE date(created_at) = date('now')
    `).count,
        // Notification metrics
        totalNotifications: get('SELECT COUNT(*) as count FROM notifications').count,
        unreadNotifications: get('SELECT COUNT(*) as count FROM notifications WHERE read = 0').count,
        readNotifications: get('SELECT COUNT(*) as count FROM notifications WHERE read = 1').count,
        // Total confirmations (all votes)
        totalConfirmations: get('SELECT COUNT(*) as count FROM confirmations').count,
        // System metrics
        system: {
            memoryUsage: process.memoryUsage(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAvg: os.loadavg(),
            uptime: process.uptime(),
            platform: `${os.type()} ${os.release()} (${os.arch()})`,
            distro: osDistro,
            hostname: os.hostname(),
            ips: networkIps,
            nodeVersion: process.version,
            disk
        }
    };

    res.json({ stats });
});

// Get distinct log actions for filters
router.get('/logs/actions', (req, res) => {
    // Select distinct actions for autocomplete
    const actions = all('SELECT DISTINCT action FROM logs ORDER BY action ASC');
    res.json({ actions: actions.map(a => a.action) });
});

// Get logs with pagination and filters
router.get('/logs', (req, res) => {
    const {
        page = 1,
        limit = 50,
        action,
        userId,
        startDate,
        endDate
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
    SELECT l.*, u.nickname as user_nickname
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
    let countSql = 'SELECT COUNT(*) as count FROM logs WHERE 1=1';
    const params = [];
    const countParams = [];

    if (action) {
        sql += ' AND l.action = ?';
        countSql += ' AND action = ?';
        params.push(action);
        countParams.push(action);
    }

    if (userId) {
        sql += ' AND l.user_id = ?';
        countSql += ' AND user_id = ?';
        params.push(userId);
        countParams.push(userId);
    }

    if (startDate) {
        sql += ' AND datetime(l.created_at) >= datetime(?)';
        countSql += ' AND datetime(created_at) >= datetime(?)';
        params.push(startDate);
        countParams.push(startDate);
    }

    if (endDate) {
        sql += ' AND datetime(l.created_at) <= datetime(?)';
        countSql += ' AND datetime(created_at) <= datetime(?)';
        params.push(endDate);
        countParams.push(endDate);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const logs = all(sql, params);
    const total = get(countSql, countParams).count;

    res.json({
        logs: logs.map(l => ({
            ...l,
            metadata: l.metadata ? JSON.parse(l.metadata) : null
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Get all users
router.get('/users', (req, res) => {
    const users = all(`
    SELECT u.*,
      (SELECT COUNT(*) FROM points WHERE user_id = u.id) as points_count,
      (SELECT COUNT(*) FROM confirmations WHERE user_id = u.id) as actions_count
    FROM users u
    ORDER BY u.last_active DESC
  `);

    res.json({ users });
});

// Get specific user details
router.get('/users/:id', (req, res) => {
    const userId = req.params.id;

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const points = all('SELECT * FROM points WHERE user_id = ?', [userId]);
    const recentLogs = all(`
    SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `, [userId]);

    res.json({
        user,
        points,
        recentLogs: recentLogs.map(l => ({
            ...l,
            metadata: l.metadata ? JSON.parse(l.metadata) : null
        }))
    });
});

// Delete user (admin only)
router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        // Delete all related data (cascade)
        run('DELETE FROM confirmations WHERE user_id = ?', [userId]);
        run('DELETE FROM notifications WHERE user_id = ?', [userId]);
        run('DELETE FROM push_subscriptions WHERE user_id = ?', [userId]);
        run('DELETE FROM logs WHERE user_id = ?', [userId]);
        run('DELETE FROM points WHERE user_id = ?', [userId]);
        run('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: `User ${user.nickname || user.id} deleted successfully`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all notifications (admin only)
router.get('/notifications', (req, res) => {
    const notifications = all(`
        SELECT n.*, u.nickname as user_nickname
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
    `);

    res.json({ notifications });
});

// Get all confirmations (admin only)
router.get('/confirmations', (req, res) => {
    const confirmations = all(`
        SELECT c.*, 
               u.nickname as user_nickname,
               p.latitude, p.longitude, p.address, p.status as point_status
        FROM confirmations c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN points p ON c.point_id = p.id
        ORDER BY c.created_at DESC
    `);

    res.json({ confirmations });
});


// Get all points (for admin map)
router.get('/points', (req, res) => {
    const points = all(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `);

    res.json({ points });
});

// Delete point (admin only)
router.delete('/points/:id', (req, res) => {
    const pointId = req.params.id;

    const point = get('SELECT * FROM points WHERE id = ?', [pointId]);

    if (!point) {
        return res.status(404).json({ error: 'Point not found' });
    }

    try {
        // Delete related data first
        run('DELETE FROM confirmations WHERE point_id = ?', [pointId]);
        run('DELETE FROM points WHERE id = ?', [pointId]);

        res.json({
            success: true,
            message: `Point ${pointId} deleted successfully`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete point' });
    }
});

// Export logs
router.get('/logs/export', (req, res) => {
    const { format = 'json', startDate, endDate } = req.query;

    let sql = `
    SELECT l.*, u.nickname as user_nickname
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
    const params = [];

    if (startDate) {
        sql += ' AND datetime(l.created_at) >= datetime(?)';
        params.push(startDate);
    }

    if (endDate) {
        sql += ' AND datetime(l.created_at) <= datetime(?)';
        params.push(endDate);
    }

    sql += ' ORDER BY l.created_at DESC';

    const logs = all(sql, params);

    if (format === 'csv') {
        const headers = ['id', 'user_id', 'user_nickname', 'action', 'target_id', 'metadata', 'created_at'];
        const csv = [
            headers.join(','),
            ...logs.map(l => headers.map(h => {
                const val = l[h] || '';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=nestfinder-logs.csv');
        return res.send(csv);
    }

    res.json({
        logs: logs.map(l => ({
            ...l,
            metadata: l.metadata ? JSON.parse(l.metadata) : null
        })),
        exported_at: new Date().toISOString()
    });
});

// Change admin password
router.put('/password', (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const admin = get('SELECT * FROM admins WHERE id = ?', [req.admin.id]);

    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    run('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, req.admin.id]);

    res.json({ success: true, message: 'Password changed successfully' });
});

// Reset database (clear all data)
router.post('/reset', (req, res) => {
    const { confirm, target = 'all' } = req.body;
    const validTargets = ['logs', 'points', 'users', 'all'];
    if (!validTargets.includes(target)) {
        return res.status(400).json({ error: 'Invalid target' });
    }

    if (confirm !== target.toUpperCase()) {
        return res.status(400).json({ error: 'Confirmation required' });
    }

    try {
        resetDatabase(target);
        const msgs = { logs: 'Logs cleared.', points: 'Points cleared.', users: 'Users cleared.', all: 'All data cleared.' };
        res.json({ success: true, message: msgs[target] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

export default router;
