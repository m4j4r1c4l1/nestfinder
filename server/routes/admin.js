import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { getDb, run, get, all, log, getSetting, saveDatabase, DB_PATH } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

// ================== DB RECOVERY ==================

// Check for corrupt database availability
router.get('/db/corrupt-check', (req, res) => {
    try {
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) return res.json({ found: false });

        const files = fs.readdirSync(dbDir);
        const corruptFile = files.find(f => f.startsWith('nestfinder.db.corrupt'));

        res.json({ found: !!corruptFile, filename: corruptFile });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check db' });
    }
});

// Download corrupt database
router.get('/db/download-corrupt', (req, res) => {
    try {
        const dbDir = path.dirname(DB_PATH);
        const files = fs.readdirSync(dbDir);
        // Get the most recent one if multiple
        const corruptFiles = files.filter(f => f.startsWith('nestfinder.db.corrupt')).sort().reverse();

        if (corruptFiles.length === 0) return res.status(404).send('No corrupt database found');

        const filePath = path.join(dbDir, corruptFiles[0]);
        res.download(filePath);
    } catch (error) {
        res.status(500).send('Download failed');
    }
});

// Download Active Database (Backup)
router.get('/backup', (req, res) => {
    saveDatabase(); // Ensure latest state is saved
    res.download(DB_PATH);
});

// Restore Database
router.post('/db/restore', (req, res) => {
    // Basic body parser for raw binary (assuming simple setup, or we need multer)
    // For simplicity with standard Express json/urlencoded, we might need a raw buffer parser.
    // However, let's assume the frontend sends it as a blob and we stream it to file.
    // BUT without a file upload middleware (multer), request body streaming is safer.

    // Actually, simpler approach:
    // If request size is < 50MB (likely), we can just try to write `req.body` if configured for raw.
    // But default express usually isn't.
    // Let's implement a simple stream writer here for the 'POST' body.

    try {
        const timestamp = Date.now();
        const backupPath = `${DB_PATH}.restore_backup.${timestamp}`;

        // Backup current active DB just in case
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, backupPath);
        }

        const writeStream = fs.createWriteStream(DB_PATH);
        req.pipe(writeStream);

        writeStream.on('finish', async () => {
            // Force a server restart or DB reload would be ideal here.
            // For now, we'll try to reload it in-memory.
            try {
                // HOT RELOAD ATTEMPT
                const { initDatabase, getDb } = await import('../database.js');
                await initDatabase();
                const newDb = getDb();

                if (newDb._recovered) {
                    res.status(422).json({ error: 'Restore Rejected: The uploaded database file is corrupt. The server has reset to a clean state.' });
                    // Optional: Maybe revert? but file is already overwritten.
                    // This is acceptable as a "safety net" - the user is warned their file was bad.
                } else {
                    res.json({ success: true, message: 'Database restored successfully. Server has reloaded.' });
                }
            } catch (e) {
                // If hot reload fails, process.exit(0) to let PM2/Render restart it is safer
                res.json({ success: true, message: 'Database restored. Restarting server...' });
                setTimeout(() => process.exit(0), 1000);
            }
        });

        writeStream.on('error', (err) => {
            console.error('Restore write error:', err);
            res.status(500).json({ error: 'Failed to write database file' });
        });

    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ error: 'Failed to initiate restore' });
    }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
    // Get disk usage (Linux/Mac only, fallback for Windows)
    let disk = null;
    let osDistro = 'Unknown';
    let networkIps = [];
    let publicIp = 'Unknown';

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

    // Fetch Public IP
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            publicIp = data.ip;
        }
    } catch (e) {
        // Keep as 'Unknown'
    }

    // Get DB file size
    let dbSizeBytes = 0;
    try {
        const dbStats = fs.statSync(DB_PATH);
        dbSizeBytes = dbStats.size;
    } catch (e) { /* ignore */ }

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
        // Database size
        dbSizeBytes,
        // System metrics
        system: {
            memoryUsage: process.memoryUsage(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAvg: os.loadavg(),
            cpuUsage: process.cpuUsage(),
            uptime: process.uptime(),
            platform: `${os.type()} ${os.release()} (${os.arch()})`,
            distro: osDistro,
            hostname: os.hostname(),
            ips: networkIps,
            publicIp,
            nodeVersion: process.version,
            disk,
            // Render-specific info (null if not on Render)
            render: process.env.RENDER ? {
                service: process.env.RENDER_SERVICE_NAME || 'unknown',
                instance: process.env.RENDER_INSTANCE_ID || 'unknown',
                region: process.env.RENDER_REGION || 'unknown'
            } : null
        }
    };

    res.json({ stats });
});

// Get historical metrics for charting
router.get('/metrics/history', (req, res) => {
    const { days = 7 } = req.query;

    // Get daily metrics for the past N days
    const metrics = [];

    for (let i = parseInt(days) - 1; i >= 0; i--) {
        const dateOffset = `-${i} days`;
        const dateLabel = i === 0 ? 'today' : dateOffset;

        // Get date string for the day
        const dateRow = get(`SELECT date('now', '${dateOffset}') as date_val`);
        const dateStr = dateRow.date_val;

        // Users active this day (Daily Active Users) - EXCLUDE ADMINS
        const usersCount = get(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM logs 
            WHERE date(created_at) = date('now', '${dateOffset}')
            AND user_id != 'admin' AND action NOT LIKE 'admin_%'
        `).count;

        // ===== NOTIFICATIONS SENT (to users) =====
        // Total notifications sent up to this date (CUMULATIVE)
        const notificationsCount = get(`SELECT COUNT(*) as count FROM notifications WHERE date(created_at) <= date('now', '${dateOffset}')`).count;

        // Daily counts for status breakdown (NON-CUMULATIVE)
        const dailySent = get(`SELECT COUNT(*) as count FROM notifications WHERE date(created_at) = date('now', '${dateOffset}')`).count;
        const dailyDelivered = get(`SELECT COUNT(*) as count FROM notifications WHERE delivered = 1 AND date(created_at) = date('now', '${dateOffset}')`).count;
        const dailyRead = get(`SELECT COUNT(*) as count FROM notifications WHERE read = 1 AND date(created_at) = date('now', '${dateOffset}')`).count;

        // ===== FEEDBACK RECEIVED (from users) =====
        // Total feedback received up to this date (CUMULATIVE)
        const totalReceived = get(`SELECT COUNT(*) as count FROM feedback WHERE date(created_at) <= date('now', '${dateOffset}')`).count;

        // Daily counts for status breakdown (NON-CUMULATIVE)
        const dailyReceivedTotal = get(`SELECT COUNT(*) as count FROM feedback WHERE date(created_at) = date('now', '${dateOffset}')`).count;
        const dailyReceivedPending = get(`SELECT COUNT(*) as count FROM feedback WHERE status IN ('new', 'sent', 'delivered', 'pending') AND date(created_at) = date('now', '${dateOffset}')`).count;
        const dailyReceivedRead = get(`SELECT COUNT(*) as count FROM feedback WHERE status IN ('read', 'reviewed') AND date(created_at) = date('now', '${dateOffset}')`).count;

        metrics.push({
            date: dateStr,
            users: usersCount,
            // Sent Notifications
            notifications: notificationsCount,  // Cumulative total
            sent: dailySent,                    // Daily
            delivered: dailyDelivered,          // Daily
            read: dailyRead,                    // Daily
            // Received Feedback
            totalReceived: totalReceived,       // Cumulative total
            receivedDaily: dailyReceivedTotal,  // Daily total
            receivedPending: dailyReceivedPending, // Daily pending
            receivedRead: dailyReceivedRead     // Daily read
        });
    }

    res.json({ metrics });
});

// Get daily breakdown of actions (for specific date)
router.get('/metrics/daily-breakdown', (req, res) => {
    const { date } = req.query; // YYYY-MM-DD

    if (!date) {
        return res.status(400).json({ error: 'Date required' });
    }

    // 1. Fetch all raw logs for the date to process in memory - EXCLUDE ADMINS
    const logs = all(`
        SELECT user_id, action 
        FROM logs 
        WHERE date(created_at) = ?
        AND user_id != 'admin' AND action NOT LIKE 'admin_%'
    `, [date]);

    // 2. Identify Cohorts
    const newUsers = new Set();       // Set of user_ids who registered today
    const returningUsers = new Set(); // Set of user_ids active today but didn't register today

    // First pass: Identify new registered users
    logs.forEach(l => {
        if (l.action === 'register') {
            newUsers.add(l.user_id);
        }
    });

    // Second pass: Populate returning users
    logs.forEach(l => {
        if (!newUsers.has(l.user_id)) {
            returningUsers.add(l.user_id);
        }
    });

    // 3. Group Actions by Cohort
    const actionsByNewUsers = {};      // { action: Set(user_ids) }
    const actionsByReturningUsers = {}; // { action: Set(user_ids) }

    logs.forEach(l => {
        if (newUsers.has(l.user_id)) {
            // Action by New User
            if (l.action !== 'register') {
                if (!actionsByNewUsers[l.action]) actionsByNewUsers[l.action] = new Set();
                actionsByNewUsers[l.action].add(l.user_id);
            }
        } else {
            // Action by Returning User
            if (!actionsByReturningUsers[l.action]) actionsByReturningUsers[l.action] = new Set();
            actionsByReturningUsers[l.action].add(l.user_id);
        }
    });

    // 4. Build Hierarchical Tree
    const breakdown = [];

    // 4a. Register Cohort (Root)
    if (newUsers.size > 0) {
        const children = Object.entries(actionsByNewUsers)
            .map(([act, set]) => ({ action: act, count: set.size }))
            .sort((a, b) => b.count - a.count); // Sort children by count

        breakdown.push({
            action: 'register',
            count: newUsers.size,
            children
        });
    }

    // 4b. Returning User Cohorts (Other Roots)
    const otherRoots = Object.entries(actionsByReturningUsers)
        .map(([act, set]) => ({ action: act, count: set.size, children: [] }))
        .sort((a, b) => b.count - a.count);

    breakdown.push(...otherRoots);

    // Calculate total unique active users
    const totalUsers = newUsers.size + returningUsers.size;

    res.json({ breakdown, totalUsers });
});

// Get distinct log actions for filters
router.get('/logs/actions', (req, res) => {
    // Select distinct actions for autocomplete
    const actions = all('SELECT DISTINCT action FROM logs ORDER BY action ASC');
    res.json({ actions: actions.map(a => a.action) });
});

// Get logs with pagination, filters, and sorting
router.get('/logs', (req, res) => {
    const {
        page = 1,
        limit = 50,
        action,
        userId,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortDir = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['created_at', 'action', 'user_nickname', 'user_id'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

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

    // Apply sorting - handle user_nickname specially since it's from JOIN
    const orderColumn = sortColumn === 'user_nickname' ? 'u.nickname' : `l.${sortColumn}`;
    sql += ` ORDER BY ${orderColumn} ${sortDirection} LIMIT ${parseInt(limit)} OFFSET ${offset}`;

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
    try {
        const { page = 1, limit = 50, sort = 'last_active', dir = 'desc', search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const direction = dir === 'asc' ? 'ASC' : 'DESC';

        // Prepare SQL for filtering
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ` AND (
                nickname LIKE ? 
                OR id LIKE ? 
                OR device_id LIKE ?
                OR CAST(COALESCE(trust_score, 0) AS TEXT) LIKE ?
                OR (CASE 
                    WHEN trust_score >= 50 THEN 'Eagle' 
                    WHEN trust_score >= 30 THEN 'Owl' 
                    WHEN trust_score >= 10 THEN 'Sparrow' 
                    ELSE 'Hatchling' 
                END) LIKE ?
                OR (CASE WHEN blocked = 1 THEN 'Blocked' ELSE 'Active' END) LIKE ?
            )`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
        }

        // Map sort keys to columns
        const validSorts = ['id', 'nickname', 'created_at', 'last_active', 'trust_score', 'points_count', 'actions_count'];
        const orderBy = validSorts.includes(sort) ? sort : 'last_active';

        // Main Query
        const users = all(`
            SELECT u.*,
              (SELECT COUNT(*) FROM points WHERE user_id = u.id) as points_count,
              (SELECT COUNT(*) FROM confirmations WHERE user_id = u.id) as actions_count
            FROM users u
            ${whereClause}
            ORDER BY ${orderBy} ${direction}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Count for Pagination
        const countResult = get(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
        const total = countResult ? countResult.count : 0;

        // Badge Counts (Global)
        const stats = {
            eagle: get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 50').count,
            owl: get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 30 AND trust_score < 50').count,
            sparrow: get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 10 AND trust_score < 30').count,
            hatchling: get('SELECT COUNT(*) as count FROM users WHERE trust_score < 10 OR trust_score IS NULL').count,
            blocked: get('SELECT COUNT(*) as count FROM users WHERE blocked = 1').count
        };

        res.json({ users, total, stats });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
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

// Block user (admin only)
router.put('/users/:id/block', (req, res) => {
    const userId = req.params.id;

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        run('UPDATE users SET blocked = 1 WHERE id = ?', [userId]);
        log('admin', 'user_blocked', userId, { nickname: user.nickname });
        res.json({ success: true, message: `User ${user.nickname || user.id} blocked` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to block user' });
    }
});

// Unblock user (admin only)
router.put('/users/:id/unblock', (req, res) => {
    const userId = req.params.id;

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        run('UPDATE users SET blocked = 0 WHERE id = ?', [userId]);
        log('admin', 'user_unblocked', userId, { nickname: user.nickname });
        res.json({ success: true, message: `User ${user.nickname || user.id} unblocked` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

// Update user trust score (admin only)
router.put('/users/:id/trust-score', (req, res) => {
    const userId = req.params.id;
    const { trust_score } = req.body;

    if (trust_score === undefined || trust_score < 0) {
        return res.status(400).json({ error: 'Valid trust_score required' });
    }

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        run('UPDATE users SET trust_score = ? WHERE id = ?', [trust_score, userId]);
        log('admin', 'trust_score_updated', userId, { old_score: user.trust_score, new_score: trust_score });
        res.json({ success: true, trust_score });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update trust score' });
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

// Download Database Backup
router.get('/backup', (req, res) => {
    try {
        // 1. Force save to disk to ensure backup is fresh
        saveDatabase();

        // 2. Serve the file
        // We use import { DB_PATH } from '../database.js' which we need to add to imports


        res.download(DB_PATH, `nestfinder_backup_${new Date().toISOString().split('T')[0]}.db`, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download backup' });
                }
            }
        });
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
});

// ================== BROADCASTS ==================

// List all broadcasts with view stats
router.get('/broadcasts', (req, res) => {
    try {
        const broadcasts = all(`
            SELECT b.*,
                (SELECT COUNT(*) FROM broadcast_views WHERE broadcast_id = b.id) as total_users,
                (SELECT COUNT(*) FROM broadcast_views WHERE broadcast_id = b.id AND status = 'sent') as sent_count,
                (SELECT COUNT(*) FROM broadcast_views WHERE broadcast_id = b.id AND status = 'delivered') as delivered_count,
                (SELECT COUNT(*) FROM broadcast_views WHERE broadcast_id = b.id AND status = 'read') as read_count
            FROM broadcasts b
            ORDER BY b.created_at DESC
        `);
        res.json({ broadcasts });
    } catch (err) {
        console.error('Failed to fetch broadcasts:', err);
        res.status(500).json({ error: 'Failed to fetch broadcasts' });
    }
});

// Get views for a specific broadcast (Sent History style)
router.get('/broadcasts/:id/views', (req, res) => {
    const { id } = req.params;

    const broadcast = get('SELECT * FROM broadcasts WHERE id = ?', [id]);
    if (!broadcast) {
        return res.status(404).json({ error: 'Broadcast not found' });
    }

    const views = all(`
        SELECT bv.*, u.nickname as user_nickname
        FROM broadcast_views bv
        LEFT JOIN users u ON bv.user_id = u.id
        WHERE bv.broadcast_id = ?
        ORDER BY bv.created_at DESC
    `, [id]);

    // Stats summary
    const stats = {
        total: views.length,
        sent: views.filter(v => v.status === 'sent').length,
        delivered: views.filter(v => v.status === 'delivered').length,
        read: views.filter(v => v.status === 'read').length
    };

    res.json({ broadcast, views, stats });
});

// Create a new broadcast (with max_views support)
router.post('/broadcasts', (req, res) => {
    const { title, message, imageUrl, startTime, endTime, maxViews, priority } = req.body;

    if (!message || !startTime || !endTime) {
        return res.status(400).json({ error: 'Message, start time, and end time are required' });
    }

    run(`
        INSERT INTO broadcasts (title, message, image_url, start_time, end_time, max_views, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title || null, message, imageUrl, startTime, endTime, maxViews || null, priority || 0]);

    const broadcast = get('SELECT * FROM broadcasts ORDER BY id DESC LIMIT 1');
    log('admin', 'broadcast_created', broadcast.id.toString(), { title, message: message.substring(0, 50), maxViews });

    res.json({ broadcast });
});

// Update broadcast max_views
router.put('/broadcasts/:id', (req, res) => {
    const { id } = req.params;
    const { maxViews, priority, start_time, end_time } = req.body;

    if (maxViews !== undefined) {
        run('UPDATE broadcasts SET max_views = ? WHERE id = ?', [maxViews || null, id]);
    }
    if (priority !== undefined) {
        run('UPDATE broadcasts SET priority = ? WHERE id = ?', [priority, id]);
    }
    if (start_time !== undefined) {
        run('UPDATE broadcasts SET start_time = ? WHERE id = ?', [start_time, id]);
    }
    if (end_time !== undefined) {
        run('UPDATE broadcasts SET end_time = ? WHERE id = ?', [end_time, id]);
    }

    const broadcast = get('SELECT * FROM broadcasts WHERE id = ?', [id]);
    res.json({ broadcast });
});

// Delete a broadcast (and its views)
router.delete('/broadcasts/:id', (req, res) => {
    const { id } = req.params;
    run('DELETE FROM broadcast_views WHERE broadcast_id = ?', [id]);
    run('DELETE FROM broadcasts WHERE id = ?', [id]);
    log('admin', 'broadcast_deleted', id);
    res.json({ success: true });
});

// ================== FEEDBACK ==================

// List all feedback
router.get('/feedback', (req, res) => {
    try {
        const { page = 1, limit = 50, sort = 'created_at', dir = 'desc' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const direction = dir === 'asc' ? 'ASC' : 'DESC';

        const validSorts = ['created_at', 'rating', 'status', 'type', 'message'];
        const orderBy = validSorts.includes(sort) ? sort : 'created_at';

        const feedback = all(`
            SELECT f.*, u.nickname as user_nickname
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY ${orderBy} ${direction}
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const total = get("SELECT COUNT(*) as count FROM feedback").count;
        const pendingCount = get("SELECT COUNT(*) as count FROM feedback WHERE status IN ('new', 'sent', 'delivered', 'pending')").count;
        const readCount = get("SELECT COUNT(*) as count FROM feedback WHERE status IN ('read', 'reviewed')").count;

        // Auto-update status to 'delivered' for fetched items that are still 'new' or 'sent'
        // This ensures the sender sees "Double Ticks" (Received) when Admin views the list
        const idsToUpdate = feedback
            .filter(f => f.status === 'new' || f.status === 'sent')
            .map(f => f.id);

        if (idsToUpdate.length > 0) {
            // Use a transaction or bulk update if possible, but for SQLite simple IN clause works well
            run(`UPDATE feedback SET status = 'delivered' WHERE id IN (${idsToUpdate.join(',')})`);

            // Update the objects in the response so the UI updates immediately (Optional, but better UX)
            // Actually, let's NOT update the response immediately so we get that "tick... double tick" effect on next poll?
            // User complained it "didn't eventually turn". Immediate update is better for "Received history table".
            // However, the user said "entry in Received history table is Sent with one tick".
            // If we update here, it will be Delivered with 2 ticks.
            feedback.forEach(f => {
                if (idsToUpdate.includes(f.id)) f.status = 'delivered';
            });
        }

        res.json({ feedback, total, pendingCount, readCount });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ error: 'Failed to get feedback' });
    }
});

// Update feedback status
router.put('/feedback/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    run('UPDATE feedback SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
});

// Delete feedback
router.delete('/feedback/:id', (req, res) => {
    const { id } = req.params;
    run('DELETE FROM feedback WHERE id = ?', [id]);
    res.json({ success: true });
});

// ================== RATINGS ==================

// Get ratings statistics for charting
router.get('/metrics/ratings', (req, res) => {
    const { days = 30 } = req.query;

    // Get daily ratings for the past N days
    const ratings = [];

    for (let i = parseInt(days) - 1; i >= 0; i--) {
        const dateOffset = `-${i} days`;
        const dateRow = get(`SELECT date('now', '${dateOffset}') as date_val`);
        const dateStr = dateRow.date_val;

        // Get rating data for this date
        const data = get(`
            SELECT total_ratings, rating_sum, rating_1, rating_2, rating_3, rating_4, rating_5
            FROM daily_ratings
            WHERE date = ?
        `, [dateStr]);

        if (data && data.total_ratings > 0) {
            ratings.push({
                date: dateStr,
                average: parseFloat((data.rating_sum / data.total_ratings).toFixed(2)),
                count: data.total_ratings,
                breakdown: {
                    1: data.rating_1,
                    2: data.rating_2,
                    3: data.rating_3,
                    4: data.rating_4,
                    5: data.rating_5
                }
            });
        } else {
            ratings.push({
                date: dateStr,
                average: 0,
                count: 0,
                breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            });
        }
    }

    res.json({ ratings });
});

// ================== DATABASE RECOVERY ==================

// Check if a corrupt database file exists
router.get('/db/corrupt-check', (req, res) => {
    try {
        const dbDir = path.dirname(DB_PATH);
        const files = fs.readdirSync(dbDir);
        // Look for files matching nestfinder.db.corrupt.*
        const corruptFile = files.find(f => f.startsWith('nestfinder.db.corrupt.'));
        if (corruptFile) {
            res.json({ found: true, filename: corruptFile });
        } else {
            res.json({ found: false });
        }
    } catch (err) {
        console.error('Corrupt check error:', err);
        res.json({ found: false, error: err.message });
    }
});

// Download the corrupt database file
router.get('/db/download-corrupt', (req, res) => {
    try {
        const dbDir = path.dirname(DB_PATH);
        const files = fs.readdirSync(dbDir);
        const corruptFile = files.find(f => f.startsWith('nestfinder.db.corrupt.'));

        if (!corruptFile) {
            return res.status(404).json({ error: 'No corrupt database file found' });
        }

        const corruptPath = path.join(dbDir, corruptFile);
        res.download(corruptPath, corruptFile, (err) => {
            if (err) {
                console.error('Download corrupt error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download corrupt file' });
                }
            }
        });
    } catch (err) {
        console.error('Download corrupt error:', err);
        res.status(500).json({ error: 'Failed to download corrupt file' });
    }
});

export default router;
