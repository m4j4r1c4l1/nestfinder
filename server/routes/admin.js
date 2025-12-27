import { Router } from 'express';
import { get, all } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

// Get dashboard stats
router.get('/stats', (req, res) => {
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
    `).count
    };

    res.json({ stats });
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

export default router;
