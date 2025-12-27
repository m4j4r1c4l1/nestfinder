import { Router } from 'express';
import db, { log, getSetting } from '../database.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();

// Broadcast function will be injected from main server
let broadcast = () => { };
export const setBroadcast = (fn) => { broadcast = fn; };

// Get all points (with optional filters)
router.get('/', (req, res) => {
    const { status, minLat, maxLat, minLng, maxLng } = req.query;

    let query = `
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
    const params = [];

    if (status) {
        const statuses = status.split(',');
        query += ` AND p.status IN (${statuses.map(() => '?').join(',')})`;
        params.push(...statuses);
    }

    if (minLat !== undefined) {
        query += ' AND p.latitude >= ?';
        params.push(parseFloat(minLat));
    }
    if (maxLat !== undefined) {
        query += ' AND p.latitude <= ?';
        params.push(parseFloat(maxLat));
    }
    if (minLng !== undefined) {
        query += ' AND p.longitude >= ?';
        params.push(parseFloat(minLng));
    }
    if (maxLng !== undefined) {
        query += ' AND p.longitude <= ?';
        params.push(parseFloat(maxLng));
    }

    query += ' ORDER BY p.created_at DESC';

    const points = db.prepare(query).all(...params);

    res.json({ points });
});

// Submit new point
router.post('/', requireUser, (req, res) => {
    const { latitude, longitude, address, notes } = req.body;

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const result = db.prepare(`
    INSERT INTO points (user_id, latitude, longitude, address, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, latitude, longitude, address || null, notes || null);

    const point = db.prepare(`
    SELECT p.*, u.nickname as submitter_nickname
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

    log(req.user.id, 'submit_point', point.id.toString(), { latitude, longitude, address });

    // Broadcast to all connected clients
    broadcast({ type: 'point_added', point });

    res.status(201).json({ point });
});

// Confirm a point
router.post('/:id/confirm', requireUser, (req, res) => {
    const pointId = parseInt(req.params.id);
    const userId = req.user.id;

    const point = db.prepare('SELECT * FROM points WHERE id = ?').get(pointId);

    if (!point) {
        return res.status(404).json({ error: 'Point not found' });
    }

    // Check if user already confirmed
    const existing = db.prepare(`
    SELECT * FROM confirmations WHERE point_id = ? AND user_id = ? AND type = 'confirm'
  `).get(pointId, userId);

    if (existing) {
        return res.status(400).json({ error: 'Already confirmed this point' });
    }

    // Add confirmation
    db.prepare(`
    INSERT INTO confirmations (point_id, user_id, type)
    VALUES (?, ?, 'confirm')
  `).run(pointId, userId);

    // Check if threshold reached
    const confirmCount = db.prepare(`
    SELECT COUNT(*) as count FROM confirmations WHERE point_id = ? AND type = 'confirm'
  `).get(pointId).count;

    const threshold = parseInt(getSetting('confirmations_required')) || 1;

    if (point.status === 'pending' && confirmCount >= threshold) {
        db.prepare(`
      UPDATE points SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pointId);
    }

    const updatedPoint = db.prepare(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(pointId);

    log(userId, 'confirm_point', pointId.toString(), { new_status: updatedPoint.status });

    broadcast({ type: 'point_updated', point: updatedPoint });

    res.json({ point: updatedPoint });
});

// Deactivate a point
router.post('/:id/deactivate', requireUser, (req, res) => {
    const pointId = parseInt(req.params.id);
    const userId = req.user.id;

    const point = db.prepare('SELECT * FROM points WHERE id = ?').get(pointId);

    if (!point) {
        return res.status(404).json({ error: 'Point not found' });
    }

    // Original poster can deactivate immediately
    if (point.user_id === userId) {
        db.prepare(`
      UPDATE points SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pointId);

        const updatedPoint = db.prepare(`
      SELECT p.*, u.nickname as submitter_nickname,
        (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
        (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
      FROM points p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(pointId);

        log(userId, 'deactivate_point', pointId.toString(), { method: 'original_poster' });

        broadcast({ type: 'point_updated', point: updatedPoint });

        return res.json({ point: updatedPoint });
    }

    // Check if user already voted
    const existing = db.prepare(`
    SELECT * FROM confirmations WHERE point_id = ? AND user_id = ? AND type = 'deactivate'
  `).get(pointId, userId);

    if (existing) {
        return res.status(400).json({ error: 'Already voted to deactivate this point' });
    }

    // Add deactivation vote
    db.prepare(`
    INSERT INTO confirmations (point_id, user_id, type)
    VALUES (?, ?, 'deactivate')
  `).run(pointId, userId);

    // Check if threshold reached
    const deactivateCount = db.prepare(`
    SELECT COUNT(*) as count FROM confirmations WHERE point_id = ? AND type = 'deactivate'
  `).get(pointId).count;

    const threshold = parseInt(getSetting('deactivations_required')) || 3;

    if (deactivateCount >= threshold) {
        db.prepare(`
      UPDATE points SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pointId);
    }

    const updatedPoint = db.prepare(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(pointId);

    log(userId, 'vote_deactivate_point', pointId.toString(), {
        deactivate_count: deactivateCount,
        threshold,
        new_status: updatedPoint.status
    });

    broadcast({ type: 'point_updated', point: updatedPoint });

    res.json({ point: updatedPoint });
});

// Export points as CSV or JSON
router.get('/export', (req, res) => {
    const { format = 'json', status } = req.query;

    let query = `
    SELECT p.id, p.latitude, p.longitude, p.address, p.status, p.notes, 
           p.created_at, u.nickname as submitter
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
    const params = [];

    if (status) {
        const statuses = status.split(',');
        query += ` AND p.status IN (${statuses.map(() => '?').join(',')})`;
        params.push(...statuses);
    }

    query += ' ORDER BY p.created_at DESC';

    const points = db.prepare(query).all(...params);

    // Log the download
    const userId = req.headers['x-user-id'];
    if (userId) {
        log(userId, 'export_points', null, { format, count: points.length });
    }

    if (format === 'csv') {
        const headers = ['id', 'latitude', 'longitude', 'address', 'status', 'notes', 'created_at', 'submitter'];
        const csv = [
            headers.join(','),
            ...points.map(p => headers.map(h => {
                const val = p[h] || '';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=nestfinder-points.csv');
        return res.send(csv);
    }

    res.json({ points, exported_at: new Date().toISOString() });
});

// Get points that need weekly validation (for original posters)
router.get('/needs-validation', requireUser, (req, res) => {
    const userId = req.user.id;

    // Get points older than 7 days that haven't been validated in the last 7 days
    const points = db.prepare(`
    SELECT * FROM points 
    WHERE user_id = ? 
    AND status != 'deactivated'
    AND datetime(last_validated) < datetime('now', '-7 days')
  `).all(userId);

    res.json({ points });
});

// Validate a point (confirm it's still active)
router.post('/:id/validate', requireUser, (req, res) => {
    const pointId = parseInt(req.params.id);
    const userId = req.user.id;

    const point = db.prepare('SELECT * FROM points WHERE id = ? AND user_id = ?').get(pointId, userId);

    if (!point) {
        return res.status(404).json({ error: 'Point not found or not owned by you' });
    }

    db.prepare(`
    UPDATE points SET last_validated = CURRENT_TIMESTAMP WHERE id = ?
  `).run(pointId);

    log(userId, 'validate_point', pointId.toString());

    res.json({ success: true });
});

export default router;
