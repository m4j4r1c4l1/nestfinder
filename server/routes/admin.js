import { Router } from 'express';
import db from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

// Get dashboard stats
router.get('/stats', (req, res) => {
    const stats = {
        totalPoints: db.prepare('SELECT COUNT(*) as count FROM points').get().count,
        pendingPoints: db.prepare('SELECT COUNT(*) as count FROM points WHERE status = ?').get('pending').count,
        confirmedPoints: db.prepare('SELECT COUNT(*) as count FROM points WHERE status = ?').get('confirmed').count,
        deactivatedPoints: db.prepare('SELECT COUNT(*) as count FROM points WHERE status = ?').get('deactivated').count,
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        activeUsers: db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE datetime(last_active) > datetime('now', '-7 days')
    `).get().count,
        todaySubmissions: db.prepare(`
      SELECT COUNT(*) as count FROM points 
      WHERE date(created_at) = date('now')
    `).get().count,
        todayActions: db.prepare(`
      SELECT COUNT(*) as count FROM logs 
      WHERE date(created_at) = date('now')
    `).get().count
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

    let query = `
    SELECT l.*, u.nickname as user_nickname
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
    let countQuery = 'SELECT COUNT(*) as count FROM logs WHERE 1=1';
    const params = [];
    const countParams = [];

    if (action) {
        query += ' AND l.action = ?';
        countQuery += ' AND action = ?';
        params.push(action);
        countParams.push(action);
    }

    if (userId) {
        query += ' AND l.user_id = ?';
        countQuery += ' AND user_id = ?';
        params.push(userId);
        countParams.push(userId);
    }

    if (startDate) {
        query += ' AND datetime(l.created_at) >= datetime(?)';
        countQuery += ' AND datetime(created_at) >= datetime(?)';
        params.push(startDate);
        countParams.push(startDate);
    }

    if (endDate) {
        query += ' AND datetime(l.created_at) <= datetime(?)';
        countQuery += ' AND datetime(created_at) <= datetime(?)';
        params.push(endDate);
        countParams.push(endDate);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const logs = db.prepare(query).all(...params);
    const total = db.prepare(countQuery).get(...countParams).count;

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
    const users = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM points WHERE user_id = u.id) as points_count,
      (SELECT COUNT(*) FROM confirmations WHERE user_id = u.id) as actions_count
    FROM users u
    ORDER BY u.last_active DESC
  `).all();

    res.json({ users });
});

// Get specific user details
router.get('/users/:id', (req, res) => {
    const userId = req.params.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const points = db.prepare('SELECT * FROM points WHERE user_id = ?').all(userId);
    const recentLogs = db.prepare(`
    SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(userId);

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
    const points = db.prepare(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();

    res.json({ points });
});

// Export logs
router.get('/logs/export', (req, res) => {
    const { format = 'json', startDate, endDate } = req.query;

    let query = `
    SELECT l.*, u.nickname as user_nickname
    FROM logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
    const params = [];

    if (startDate) {
        query += ' AND datetime(l.created_at) >= datetime(?)';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND datetime(l.created_at) <= datetime(?)';
        params.push(endDate);
    }

    query += ' ORDER BY l.created_at DESC';

    const logs = db.prepare(query).all(...params);

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
