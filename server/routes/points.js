import { Router } from 'express';
import { run, get, all, log, getSetting } from '../database.js';
import { requireUser } from '../middleware/auth.js';
import { submitPointLimiter, voteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Helper to escape XML special characters
const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Broadcast function will be injected from main server
let broadcast = () => { };
export const setBroadcast = (fn) => { broadcast = fn; };

// Get currently active broadcast (public endpoint)
router.get('/broadcast/active', (req, res) => {
  const now = new Date().toISOString();
  const activeBroadcast = get(`
    SELECT * FROM broadcasts 
    WHERE datetime(start_time) <= datetime(?)
    AND datetime(end_time) >= datetime(?)
    ORDER BY created_at DESC
    LIMIT 1
  `, [now, now]);

  res.json({ broadcast: activeBroadcast || null });
});

// Get all points (with optional filters)
router.get('/', (req, res) => {
  const { status, minLat, maxLat, minLng, maxLng } = req.query;
  const retentionDays = parseInt(getSetting('deactivation_retention_days')) || 7;

  let sql = `
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE (
      p.status != 'deactivated' 
      OR datetime(p.updated_at) > datetime('now', '-' || ? || ' days')
    )
  `;
  const params = [retentionDays];

  if (status) {
    const statuses = status.split(',');
    sql += ` AND p.status IN (${statuses.map(() => '?').join(',')})`;
    params.push(...statuses);
  }

  if (minLat !== undefined) {
    sql += ' AND p.latitude >= ?';
    params.push(parseFloat(minLat));
  }
  if (maxLat !== undefined) {
    sql += ' AND p.latitude <= ?';
    params.push(parseFloat(maxLat));
  }
  if (minLng !== undefined) {
    sql += ' AND p.longitude >= ?';
    params.push(parseFloat(minLng));
  }
  if (maxLng !== undefined) {
    sql += ' AND p.longitude <= ?';
    params.push(parseFloat(maxLng));
  }

  sql += ' ORDER BY p.created_at DESC';

  const points = all(sql, params);

  res.json({ points });
});

// Submit new point (rate limited: 20/hour)
router.post('/', submitPointLimiter, requireUser, (req, res) => {
  const { latitude, longitude, address, notes } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  run(
    `INSERT INTO points (user_id, latitude, longitude, address, notes) VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, latitude, longitude, address || null, notes || null]
  );

  // Get the last inserted point
  const point = get(`
    SELECT p.*, u.nickname as submitter_nickname
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC LIMIT 1
  `);

  log(req.user.id, 'submit_point', point.id.toString(), { latitude, longitude, address });

  // Broadcast to all connected clients
  broadcast({ type: 'point_added', point });

  res.status(201).json({ point });
});

// Confirm a point (rate limited: 30/hour)
router.post('/:id/confirm', voteLimiter, requireUser, (req, res) => {
  const pointId = parseInt(req.params.id);
  const userId = req.user.id;

  const point = get('SELECT * FROM points WHERE id = ?', [pointId]);

  if (!point) {
    return res.status(404).json({ error: 'Point not found' });
  }

  // Original poster cannot confirm their own point
  if (point.user_id === userId) {
    return res.status(400).json({ error: 'You cannot confirm your own report' });
  }

  // Check if user already confirmed
  const existing = get(
    `SELECT * FROM confirmations WHERE point_id = ? AND user_id = ? AND type = 'confirm'`,
    [pointId, userId]
  );

  if (existing) {
    return res.status(400).json({ error: 'Already confirmed this point' });
  }

  // Add confirmation
  run(
    `INSERT INTO confirmations (point_id, user_id, type) VALUES (?, ?, 'confirm')`,
    [pointId, userId]
  );

  // REWARD: Instant gratification for voting (+1)
  run('UPDATE users SET trust_score = trust_score + 1 WHERE id = ?', [userId]);

  // Check if threshold reached (Weighted Voting)
  // Guardians (Trust >= 50) have 3x voting power
  const confirmWeight = get(`
    SELECT SUM(
      CASE WHEN u.trust_score >= 50 THEN 3 ELSE 1 END
    ) as weight
    FROM confirmations c
    JOIN users u ON c.user_id = u.id
    WHERE c.point_id = ? AND c.type = 'confirm'
  `, [pointId]).weight || 0;

  const threshold = parseInt(getSetting('confirmations_required')) || 1; // Usually 3 in prod

  if (point.status === 'pending' && confirmWeight >= threshold) {
    run(
      `UPDATE points SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [pointId]
    );

    // REWARD: Submitter gets +5 points when confirmed
    run('UPDATE users SET trust_score = trust_score + 5 WHERE id = ?', [point.user_id]);
  }

  const updatedPoint = get(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [pointId]);

  log(userId, 'confirm_point', pointId.toString(), { new_status: updatedPoint.status });
  broadcast({ type: 'point_updated', point: updatedPoint });

  // Fetch updated score for client-side gamification
  const newScore = get('SELECT trust_score FROM users WHERE id = ?', [userId]).trust_score;
  res.json({ point: updatedPoint, user_trust_score: newScore });
});

// Deactivate a point (rate limited: 30/hour)
router.post('/:id/deactivate', voteLimiter, requireUser, (req, res) => {
  const pointId = parseInt(req.params.id);
  const userId = req.user.id;

  const point = get('SELECT * FROM points WHERE id = ?', [pointId]);

  if (!point) {
    return res.status(404).json({ error: 'Point not found' });
  }

  // Original poster can deactivate immediately
  if (point.user_id === userId) {
    run(
      `UPDATE points SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [pointId]
    );

    const updatedPoint = get(`
      SELECT p.*, u.nickname as submitter_nickname,
        (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
        (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
      FROM points p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [pointId]);

    log(userId, 'deactivate_point', pointId.toString(), { method: 'original_poster' });

    broadcast({ type: 'point_updated', point: updatedPoint });

    return res.json({ point: updatedPoint });
  }

  // Check if user already voted
  const existing = get(
    `SELECT * FROM confirmations WHERE point_id = ? AND user_id = ? AND type = 'deactivate'`,
    [pointId, userId]
  );

  if (existing) {
    return res.status(400).json({ error: 'Already voted to deactivate this point' });
  }

  // Add deactivation vote
  run(
    `INSERT INTO confirmations (point_id, user_id, type) VALUES (?, ?, 'deactivate')`,
    [pointId, userId]
  );

  // Check if threshold reached
  const deactivateCount = get(
    `SELECT COUNT(*) as count FROM confirmations WHERE point_id = ? AND type = 'deactivate'`,
    [pointId]
  ).count;

  const threshold = parseInt(getSetting('deactivations_required')) || 3;

  if (deactivateCount >= threshold) {
    run(
      `UPDATE points SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [pointId]
    );
  }

  const updatedPoint = get(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [pointId]);

  log(userId, 'vote_deactivate_point', pointId.toString(), {
    deactivate_count: deactivateCount,
    threshold,
    new_status: updatedPoint.status
  });

  broadcast({ type: 'point_updated', point: updatedPoint });

  res.json({ point: updatedPoint });
});

// Reactivate a deactivated point (moves to pending)
router.post('/:id/reactivate', requireUser, (req, res) => {
  const pointId = parseInt(req.params.id);
  const userId = req.user.id;

  const point = get('SELECT * FROM points WHERE id = ?', [pointId]);

  if (!point) {
    return res.status(404).json({ error: 'Point not found' });
  }

  if (point.status !== 'deactivated') {
    return res.status(400).json({ error: 'Only deactivated points can be reactivated' });
  }

  // Check if still within retention period
  const retentionDays = parseInt(getSetting('deactivation_retention_days')) || 7;
  const deactivatedAt = new Date(point.updated_at);
  const expiresAt = new Date(deactivatedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);

  if (new Date() > expiresAt) {
    return res.status(400).json({ error: 'This point has expired and cannot be reactivated' });
  }

  // Reactivate: set status to pending, clear deactivation votes
  run('DELETE FROM confirmations WHERE point_id = ? AND type = ?', [pointId, 'deactivate']);
  run(
    `UPDATE points SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [pointId]
  );

  const updatedPoint = get(`
    SELECT p.*, u.nickname as submitter_nickname,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'confirm') as confirm_count,
      (SELECT COUNT(*) FROM confirmations WHERE point_id = p.id AND type = 'deactivate') as deactivate_count
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [pointId]);

  log(userId, 'reactivate_point', pointId.toString());

  broadcast({ type: 'point_updated', point: updatedPoint });

  res.json({ point: updatedPoint });
});

// Export points as CSV or JSON
router.get('/export', (req, res) => {
  const { format = 'json', status } = req.query;

  let sql = `
    SELECT p.id, p.latitude, p.longitude, p.address, p.status, p.notes, 
           p.created_at, u.nickname as submitter
    FROM points p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    const statuses = status.split(',');
    sql += ` AND p.status IN (${statuses.map(() => '?').join(',')})`;
    params.push(...statuses);
  }

  sql += ' ORDER BY p.created_at DESC';

  const points = all(sql, params);

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
    res.setHeader('Content-Disposition', 'attachment; filename=nestfinder-nests.csv');
    return res.send(csv);
  }

  // GPX format - GPS Exchange Format
  if (format === 'gpx') {
    const gpxPoints = points.map(p => {
      const name = p.address ? p.address.split(',')[0] : `Point ${p.id}`;
      const desc = [
        p.status ? `Status: ${p.status}` : '',
        p.notes || '',
        p.submitter ? `Submitted by: ${p.submitter}` : ''
      ].filter(Boolean).join('\n');

      return `  <wpt lat="${p.latitude}" lon="${p.longitude}">
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(desc)}</desc>
    <time>${p.created_at}</time>
    <sym>${p.status === 'confirmed' ? 'Flag, Green' : p.status === 'deactivated' ? 'Flag, Red' : 'Flag, Blue'}</sym>
  </wpt>`;
    }).join('\n');

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NestFinder" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>NestFinder Export</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
${gpxPoints}
</gpx>`;

    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', 'attachment; filename=nestfinder-nests.gpx');
    return res.send(gpx);
  }

  // KML format - Keyhole Markup Language (Google Earth)
  if (format === 'kml') {
    const styleMap = {
      confirmed: '#confirmedStyle',
      pending: '#pendingStyle',
      deactivated: '#deactivatedStyle'
    };

    const kmlPoints = points.map(p => {
      const name = p.address ? p.address.split(',')[0] : `Point ${p.id}`;
      const desc = [
        p.address || '',
        p.status ? `Status: ${p.status}` : '',
        p.notes || '',
        p.submitter ? `Submitted by: ${p.submitter}` : '',
        `Created: ${p.created_at}`
      ].filter(Boolean).join('<br/>');

      return `    <Placemark>
      <name>${escapeXml(name)}</name>
      <description><![CDATA[${desc}]]></description>
      <styleUrl>${styleMap[p.status] || '#pendingStyle'}</styleUrl>
      <Point>
        <coordinates>${p.longitude},${p.latitude},0</coordinates>
      </Point>
      <ExtendedData>
        <Data name="status"><value>${p.status}</value></Data>
        <Data name="id"><value>${p.id}</value></Data>
      </ExtendedData>
    </Placemark>`;
    }).join('\n');

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>NestFinder Export</name>
    <description>Exported points from NestFinder</description>
    <Style id="confirmedStyle">
      <IconStyle><color>ff00ff00</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon></IconStyle>
    </Style>
    <Style id="pendingStyle">
      <IconStyle><color>ff00a5ff</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png</href></Icon></IconStyle>
    </Style>
    <Style id="deactivatedStyle">
      <IconStyle><color>ff0000ff</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href></Icon></IconStyle>
    </Style>
${kmlPoints}
  </Document>
</kml>`;

    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', 'attachment; filename=nestfinder-nests.kml');
    return res.send(kml);
  }

  // JSON format - pretty printed for readability
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=nestfinder-nests.json');
  const jsonData = { points, exported_at: new Date().toISOString() };
  res.send(JSON.stringify(jsonData, null, 2));
});

// Get points that need weekly validation (for original posters)
router.get('/needs-validation', requireUser, (req, res) => {
  const userId = req.user.id;

  // Get points older than 7 days that haven't been validated in the last 7 days
  const points = all(`
    SELECT * FROM points 
    WHERE user_id = ? 
    AND status != 'deactivated'
    AND datetime(last_validated) < datetime('now', '-7 days')
  `, [userId]);

  res.json({ points });
});

// Validate a point (confirm it's still active)
router.post('/:id/validate', requireUser, (req, res) => {
  const pointId = parseInt(req.params.id);
  const userId = req.user.id;

  const point = get('SELECT * FROM points WHERE id = ? AND user_id = ?', [pointId, userId]);

  if (!point) {
    return res.status(404).json({ error: 'Point not found or not owned by you' });
  }

  run(`UPDATE points SET last_validated = CURRENT_TIMESTAMP WHERE id = ?`, [pointId]);

  log(userId, 'validate_point', pointId.toString());

  res.json({ success: true });
});

// ================== FEEDBACK ==================

// Get feedback history for a user
router.get('/feedback', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const feedback = all(`
    SELECT * FROM feedback
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId]);

  res.json({ feedback });
});

// Prune old feedback
router.delete('/feedback/prune', (req, res) => {
  const { cutoff } = req.body;
  if (!cutoff) return res.status(400).json({ error: 'Cutoff date required' });

  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  run(`
    DELETE FROM feedback
    WHERE user_id = ? AND created_at < ?
  `, [userId, cutoff]);

  res.json({ success: true, message: 'Feedback pruned' });
});

// Submit feedback (bugs, suggestions)
router.post('/feedback', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { type, message, rating } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  // Store feedback with optional rating
  run(`
    INSERT INTO feedback (user_id, type, message, rating)
    VALUES (?, ?, ?, ?)
  `, [userId || null, type || 'general', message, rating || null]);

  // If rating provided, update daily_ratings aggregation
  if (rating && rating >= 1 && rating <= 5) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const ratingCol = `rating_${rating}`;

    // Upsert into daily_ratings
    run(`
      INSERT INTO daily_ratings (date, total_ratings, rating_sum, ${ratingCol})
      VALUES (?, 1, ?, 1)
      ON CONFLICT(date) DO UPDATE SET
        total_ratings = total_ratings + 1,
        rating_sum = rating_sum + ?,
        ${ratingCol} = ${ratingCol} + 1
    `, [today, rating, rating]);
  }

  log(userId || 'anonymous', 'feedback_submitted', null, { type, rating });

  res.json({ success: true, message: 'Thank you for your feedback!' });
});

export default router;
