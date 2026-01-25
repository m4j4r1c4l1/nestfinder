import express from 'express';
import { getDb, run, get, all, log, getSetting } from '../database.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';
import { calculateDevMetrics } from '../utils/devMetrics.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const router = express.Router();

// WebSocket broadcast function (injected from index.js)
let broadcast = () => { };
export const setBroadcast = (fn) => { broadcast = fn; };

// Notification templates
const templates = {
    new_points: {
        title: '🪹 New Locations Reported',
        body: 'New assistance locations have been added near you. Check the map for updates!'
    },
    status_update: {
        title: '✅ Status Update',
        body: 'Some locations have been confirmed or updated. Check the latest information!'
    },
    reminder: {
        title: '📍 Weekly Reminder',
        body: 'Have you seen any locations that need updating? Help keep the map accurate!'
    },
    announcement: {
        title: '📢 Announcement',
        body: '' // Body will be filled by admin
    },
    urgent: {
        title: '🚨 Urgent Notice',
        body: '' // Body will be filled by admin
    }
};

// ========================================
// BROADCAST ROUTES (Unified from points.js and push routes)
// ========================================

// Get currently active broadcast (with view tracking)
// Legacy path: GET /api/points/broadcast/active
router.get('/broadcast/active', requireUser, (req, res) => {
    const userId = req.user.id;
    const now = new Date().toISOString();

    // Get all active broadcasts
    const activeBroadcasts = all(`
    SELECT * FROM broadcasts 
    WHERE datetime(start_time) <= datetime(?)
    AND datetime(end_time) >= datetime(?)
    ORDER BY priority DESC, created_at DESC
  `, [now, now]);

    if (!activeBroadcasts.length) {
        return res.json({ broadcast: null, count: 0 });
    }

    // Find a broadcast the user hasn't exceeded max_views for
    let selectedBroadcast = null;

    for (const b of activeBroadcasts) {
        // Check user's view record for this broadcast
        let viewRecord = get(`
      SELECT * FROM broadcast_views 
      WHERE broadcast_id = ? AND user_id = ?
    `, [b.id, userId]);

        // Check User Status (Dismissed/Read) - Universal Rule
        if (viewRecord && viewRecord.status === 'read') {
            continue; // User explicitly dismissed it
        }

        // Global Max Views Enforcement
        if (b.max_views !== null) {
            if (!viewRecord) {
                const globalCount = get('SELECT COUNT(*) as count FROM broadcast_views WHERE broadcast_id = ?', [b.id]).count;
                if (globalCount >= b.max_views) {
                    continue; // Global cap met, no new slots available
                }
            }
        }

        // This is a valid broadcast for this user
        selectedBroadcast = b;

        // Create or update view record
        if (!viewRecord) {
            run(`
        INSERT INTO broadcast_views (broadcast_id, user_id, status, view_count, first_seen_at, delivered_at)
        VALUES (?, ?, 'delivered', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [b.id, userId]);
        } else {
            run(`
        UPDATE broadcast_views 
        SET view_count = view_count + 1, 
            status = CASE WHEN status = 'sent' THEN 'delivered' ELSE status END,
            delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)
        WHERE broadcast_id = ? AND user_id = ?
      `, [b.id, userId]);
        }

        break;
    }

    res.json({
        broadcast: selectedBroadcast,
        count: activeBroadcasts.length
    });
});

// Mark broadcast as sent (when client fetches/receives the data)
router.post('/broadcasts/:id/sent', requireUser, (req, res) => {
    try {
        const userId = req.user.id;
        const broadcastId = req.params.id;

        run(`
            INSERT INTO broadcast_views (broadcast_id, user_id, status, view_count, first_seen_at, fetched_at, dismissed)
            VALUES (?, ?, 'sent', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
            ON CONFLICT(broadcast_id, user_id) DO NOTHING
        `, [broadcastId, userId]);

        broadcast({
            type: 'broadcast_status',
            broadcastId: parseInt(broadcastId),
            userId,
            status: 'sent'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark broadcast sent error:', error);
        res.status(500).json({ error: 'Failed to mark broadcast as sent' });
    }
});

// Mark broadcast as delivered (when displayed to user)
router.post('/broadcasts/:id/delivered', requireUser, (req, res) => {
    try {
        const userId = req.user.id;
        const broadcastId = req.params.id;

        run(`
            INSERT INTO broadcast_views (broadcast_id, user_id, status, view_count, first_seen_at, delivered_at, dismissed)
            VALUES (?, ?, 'delivered', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
            ON CONFLICT(broadcast_id, user_id) DO UPDATE SET 
                status = CASE WHEN status IN ('sent', 'created') THEN 'delivered' ELSE status END,
                delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
                view_count = view_count + 1
        `, [broadcastId, userId]);

        broadcast({
            type: 'broadcast_status',
            broadcastId: parseInt(broadcastId),
            userId,
            status: 'delivered'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark broadcast delivered error:', error);
        res.status(500).json({ error: 'Failed to mark broadcast as delivered' });
    }
});

// Mark broadcast as read (user action - dismisses from popup)
router.post('/broadcasts/:id/read', requireUser, (req, res) => {
    try {
        const userId = req.user.id;
        const broadcastId = parseInt(req.params.id);

        if (isNaN(broadcastId)) {
            return res.status(400).json({ error: 'Invalid broadcast ID' });
        }

        const nowStr = new Date().toISOString();

        run(`
            INSERT INTO broadcast_views (broadcast_id, user_id, dismissed, status, read_at, view_count, first_seen_at)
            VALUES (?, ?, 0, 'read', ?, 1, ?)
            ON CONFLICT(broadcast_id, user_id) DO UPDATE SET 
                status = 'read', 
                read_at = ?,
                view_count = view_count + 1,
                dismissed = 0
        `, [broadcastId, userId, nowStr, nowStr, nowStr]);

        broadcast({
            type: 'broadcast_status',
            broadcastId: broadcastId,
            userId,
            status: 'read'
        });

        res.json({ success: true, status: 'read' });
    } catch (error) {
        console.error('Mark broadcast read error:', error);
        res.status(500).json({ error: 'Failed to mark broadcast as read' });
    }
});

// Delete/Dismiss individual broadcast (hard clear from history)
router.delete('/broadcasts/:id', requireUser, (req, res) => {
    try {
        const userId = req.user.id;
        const broadcastId = req.params.id;

        run(`
            INSERT INTO broadcast_views (broadcast_id, user_id, dismissed, status)
            VALUES (?, ?, 1, 'read')
            ON CONFLICT(broadcast_id, user_id) DO UPDATE SET 
                dismissed = 1
        `, [broadcastId, userId]);

        res.json({ success: true });
    } catch (error) {
        console.error('Dismiss broadcast error:', error);
        res.status(500).json({ error: 'Failed to dismiss broadcast' });
    }
});

// ========================================
// FEEDBACK ROUTES (Moved from points.js)
// ========================================

// Get feedback history for a user
router.get('/feedback', requireUser, (req, res) => {
    const userId = req.user.id;
    const feedback = all(`
    SELECT * FROM feedback
    WHERE user_id = ? AND (deleted_by_sender = 0 OR deleted_by_sender IS NULL)
    ORDER BY created_at DESC
  `, [userId]);
    res.json({ feedback });
});

// Submit feedback (bugs, suggestions)
router.post('/feedback', requireUser, (req, res) => {
    const userId = req.user.id;
    const { type, message, rating } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message required' });
    }

    run(`
    INSERT INTO feedback (user_id, type, message, rating, status)
    VALUES (?, ?, ?, ?, 'sent')
  `, [userId, type || 'general', message, rating || null]);

    if (rating && rating >= 1 && rating <= 5) {
        const today = new Date().toISOString().split('T')[0];
        const ratingCol = `rating_${rating}`;
        run(`
      INSERT INTO daily_ratings (date, total_ratings, rating_sum, ${ratingCol})
      VALUES (?, 1, ?, 1)
      ON CONFLICT(date) DO UPDATE SET
        total_ratings = total_ratings + 1,
        rating_sum = rating_sum + ?,
        ${ratingCol} = ${ratingCol} + 1
    `, [today, rating, rating]);
    }

    log(userId, 'feedback_submitted', null, { type, rating });
    res.json({ success: true, message: 'Thank you for your feedback!' });
});

// Delete individual feedback
router.delete('/feedback/:id', requireUser, (req, res) => {
    const userId = req.user.id;
    run('UPDATE feedback SET deleted_by_sender = 1 WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ success: true });
});

// Prune old feedback
router.delete('/feedback/prune', requireUser, (req, res) => {
    const { cutoff } = req.body;
    if (!cutoff) return res.status(400).json({ error: 'Cutoff date required' });
    const userId = req.user.id;
    run(`
    UPDATE feedback SET deleted_by_sender = 1
    WHERE user_id = ? AND created_at < ?
  `, [userId, cutoff]);
    res.json({ success: true, message: 'Feedback pruned' });
});

// ========================================
// NOTIFICATION ROUTES (Moved from notifications.js)
// ========================================

// Get unread notifications AND seen broadcasts
router.get('/notifications', requireUser, (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = all(
            'SELECT * FROM notifications WHERE user_id = ? AND dismissed = 0 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        const seenBroadcasts = all(`
            SELECT b.id, b.title, b.message as body, b.image_url, b.created_at,
                   v.status, v.fetched_at, v.delivered_at, v.read_at,
                   CASE WHEN v.status = 'read' THEN 1 ELSE 0 END as read,
                   'broadcast' as type
            FROM broadcasts b
            JOIN broadcast_views v ON b.id = v.broadcast_id
            WHERE v.user_id = ? AND v.dismissed = 0
            ORDER BY b.created_at DESC
            LIMIT 50
        `, [userId]);

        const now = new Date().toISOString();
        const unseenBroadcasts = all(`
            SELECT b.id, b.title, b.message as body, b.image_url, b.created_at,
                   'sent' as status, NULL as delivered_at, NULL as read_at,
                   0 as read,
                   'broadcast' as type,
                   b.max_views,
                   (SELECT COUNT(*) FROM broadcast_views bv WHERE bv.broadcast_id = b.id) as current_views
            FROM broadcasts b
            WHERE datetime(b.start_time) <= datetime(?)
            AND datetime(b.end_time) >= datetime(?)
            AND b.id NOT IN (SELECT broadcast_id FROM broadcast_views WHERE user_id = ?)
            AND (b.max_views IS NULL OR (SELECT COUNT(*) FROM broadcast_views bv WHERE bv.broadcast_id = b.id) < b.max_views)
            ORDER BY b.priority DESC, b.created_at DESC
            LIMIT 10
        `, [now, now, userId]);

        const unified = [...notifications, ...seenBroadcasts, ...unseenBroadcasts].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        }).slice(0, 50);

        res.json({ notifications: unified });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Mark notification as read
router.post('/notifications/:id/read', requireUser, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        run('UPDATE notifications SET read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, userId]);
        broadcast({ type: 'notification_status', notificationId: parseInt(id), userId, status: 'read' });
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Mark notification as delivered
router.post('/notifications/:id/delivered', requireUser, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        run('UPDATE notifications SET delivered = 1, delivered_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND delivered = 0', [id, userId]);
        broadcast({ type: 'notification_status', notificationId: parseInt(id), userId, status: 'delivered' });
        res.json({ success: true });
    } catch (error) {
        console.error('Mark delivered error:', error);
        res.status(500).json({ error: 'Failed to mark as delivered' });
    }
});

// Mark all as read
router.post('/notifications/read-all', requireUser, (req, res) => {
    try {
        const userId = req.user.id;
        run('UPDATE notifications SET read = 1 WHERE user_id = ?', [userId]);
        run("UPDATE broadcast_views SET status = 'read', read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status != 'read'", [userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// Delete individual notification (soft delete)
router.delete('/notifications/:id', requireUser, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        run('UPDATE notifications SET dismissed = 1 WHERE id = ? AND user_id = ?', [id, userId]);
        log(userId, 'delete_notification', id.toString(), { type: 'soft_delete' });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Prune old notifications
router.delete('/notifications/prune', requireUser, (req, res) => {
    const { cutoff } = req.body;
    if (!cutoff) return res.status(400).json({ error: 'Cutoff date required' });
    const userId = req.user.id;
    run('DELETE FROM notifications WHERE user_id = ? AND created_at < ?', [userId, cutoff]);
    res.json({ success: true, message: 'Notifications pruned' });
});

// ========================================
// ADMIN MESSAGING ROUTES
// ========================================

router.get('/admin/templates', requireAdmin, (req, res) => {
    res.json({ templates });
});

router.get('/admin/stats', requireAdmin, async (req, res) => {
    try {
        const total = get('SELECT COUNT(*) as count FROM users');
        const notificationCount = get('SELECT COUNT(*) as count FROM notifications');
        const unreadCount = get('SELECT COUNT(*) as count FROM notifications WHERE read = 0');
        const deliveredCount = get('SELECT COUNT(*) as count FROM notifications WHERE delivered = 1');
        const readNotificationCount = get('SELECT COUNT(*) as count FROM notifications WHERE read = 1');

        const ratingStats = get('SELECT SUM(total_ratings) as totalRatings, SUM(rating_sum) as ratingSum FROM daily_ratings');
        const avgRating = ratingStats?.totalRatings > 0 ? ratingStats.ratingSum / ratingStats.totalRatings : null;
        const feedbackCount = get('SELECT COUNT(*) as count FROM feedback');

        const confirmedPoints = get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['confirmed']);
        const pendingPoints = get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['pending']);
        const deactivatedPoints = get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['deactivated']);

        const users = all('SELECT id as user_id, nickname, created_at, last_active FROM users ORDER BY last_active DESC LIMIT 100');
        const eagleCount = get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 50');
        const owlCount = get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 30 AND trust_score < 50');
        const sparrowCount = get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 10 AND trust_score < 30');
        const hatchlingCount = get('SELECT COUNT(*) as count FROM users WHERE (trust_score IS NULL OR trust_score < 10)');

        const feedbackTotal = get('SELECT COUNT(*) as count FROM feedback');
        const feedbackPending = get("SELECT COUNT(*) as count FROM feedback WHERE status IN ('sent', 'delivered')");
        const feedbackRead = get("SELECT COUNT(*) as count FROM feedback WHERE status = 'read'");

        const devMetrics = await calculateDevMetrics(rootDir);

        const totalBroadcasts = get('SELECT COUNT(*) as count FROM broadcasts');
        const activeBroadcasts = get("SELECT COUNT(*) as count FROM broadcasts WHERE start_time <= datetime('now') AND (end_time >= datetime('now') OR end_time IS NULL)");
        const deliveredBroadcasts = get("SELECT COUNT(*) as count FROM broadcast_views WHERE status IN ('delivered', 'read')");
        const readBroadcasts = get("SELECT COUNT(*) as count FROM broadcast_views WHERE status = 'read'");
        const reachCount = get("SELECT COUNT(DISTINCT user_id) as count FROM broadcast_views");

        const broadcastMetrics = {
            total: totalBroadcasts?.count || 0,
            active: activeBroadcasts?.count || 0,
            delivered: deliveredBroadcasts?.count || 0,
            read: readBroadcasts?.count || 0,
            reach: reachCount?.count || 0,
            scheduled: get("SELECT COUNT(*) as count FROM broadcasts WHERE start_time > datetime('now')")?.count || 0,
            ended: get("SELECT COUNT(*) as count FROM broadcasts WHERE end_time < datetime('now')")?.count || 0,
            filled: get("SELECT COUNT(*) as count FROM broadcasts WHERE max_views IS NOT NULL AND (SELECT COUNT(*) FROM broadcast_views bv WHERE bv.broadcast_id = broadcasts.id) >= max_views")?.count || 0
        };

        res.json({
            totalSubscribers: total?.count || 0,
            subscribers: users,
            userLevels: { eagle: eagleCount?.count || 0, owl: owlCount?.count || 0, sparrow: sparrowCount?.count || 0, hatchling: hatchlingCount?.count || 0 },
            devMetrics,
            broadcastMetrics,
            notificationMetrics: { total: notificationCount?.count || 0, unread: unreadCount?.count || 0, delivered: deliveredCount?.count || 0, read: readNotificationCount?.count || 0 },
            feedbackMetrics: { total: feedbackTotal?.count || 0, pending: feedbackPending?.count || 0, read: feedbackRead?.count || 0 },
            avgRating,
            totalRatings: ratingStats?.totalRatings || 0,
            mapPoints: { confirmed: confirmedPoints?.count || 0, pending: pendingPoints?.count || 0, deactivated: deactivatedPoints?.count || 0 }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

router.post('/admin/send', requireAdmin, async (req, res) => {
    try {
        const { template, title, body, target, userIds, maxViews } = req.body;
        let notificationTitle = title || templates[template]?.title || 'NestFinder';
        let notificationBody = body || templates[template]?.body || 'You have a new notification';

        let targetUserIds = [];
        if (target === 'all') targetUserIds = all('SELECT id FROM users').map(u => u.id);
        else if ((target === 'selected' || target === 'one') && userIds?.length) targetUserIds = userIds;

        if (!targetUserIds.length) return res.status(404).json({ error: 'No users found for target' });

        if (maxViews > 0 && targetUserIds.length > maxViews) {
            targetUserIds.sort(() => Math.random() - 0.5);
            targetUserIds = targetUserIds.slice(0, maxViews);
        }

        const batchId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const stmt = getDb().prepare('INSERT INTO notifications (user_id, title, body, type, image_url, read, delivered, batch_id) VALUES (?, ?, ?, ?, ?, 0, 0, ?)');
        const type = template || 'custom';
        const image = req.body.imageUrl || null;

        targetUserIds.forEach(uid => stmt.run([uid, notificationTitle, notificationBody, type, image, batchId]));
        stmt.free();

        log('admin', 'notification_sent', batchId, {
            template,
            target,
            count: targetUserIds.length,
            title: notificationTitle,
            body: notificationBody,
            image
        });
        res.json({ success: true, sent: targetUserIds.length, message: `Notification sent to ${targetUserIds.length} users` });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Get batch details (for Admin "Message Details" view)
router.get('/admin/notifications/batch/:batchId', requireAdmin, (req, res) => {
    try {
        const { batchId } = req.params;

        // Get notifications in this batch joined with users
        const rows = all(`
            SELECT 
                n.id, n.user_id, n.title, n.body, n.read, n.delivered, n.created_at, n.delivered_at, n.read_at,
                u.nickname, u.device_id
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE n.batch_id = ?
            ORDER BY n.read DESC, n.delivered DESC
        `, [batchId]);

        // Calculate stats
        const stats = {
            total: rows.length,
            delivered: rows.filter(r => r.delivered && !r.read).length,
            read: rows.filter(r => r.read).length
        };

        res.json({ messages: rows, stats });
    } catch (error) {
        console.error('Batch details error:', error);
        res.status(500).json({ error: 'Failed to get batch details' });
    }
});

// Clean up/Clear all sent notification logs (admin only)
router.post('/admin/notifications/cleanup', requireAdmin, (req, res) => {
    try {
        // Delete ALL logs regarding sent notifications
        const result = run("DELETE FROM logs WHERE action = 'notification_sent'");

        log('admin', 'history_cleared', null, {
            deletedCount: result?.changes || 0
        });

        res.json({
            success: true,
            message: `Sent history cleared. Removed ${result?.changes || 0} entries.`,
            stats: {
                deleted: result?.changes || 0
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

router.get('/admin/notifications/history', requireAdmin, (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const logs = all(`
            SELECT l.*, 
                (SELECT COUNT(*) FROM notifications n WHERE n.batch_id = l.target_id AND n.read = 1) as read_count, 
                (SELECT COUNT(*) FROM notifications n WHERE n.batch_id = l.target_id AND n.delivered = 1) as delivered_count,
                (SELECT body FROM notifications n WHERE n.batch_id = l.target_id LIMIT 1) as fallback_body,
                (SELECT image_url FROM notifications n WHERE n.batch_id = l.target_id LIMIT 1) as fallback_image
             FROM logs l
             WHERE l.action = 'notification_sent' 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`, [limit, offset]);

        // Process logs to ensure body/image exist in metadata
        const processedLogs = logs.map(l => {
            const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata || '{}') : (l.metadata || {});

            if (!meta.body && l.fallback_body) meta.body = l.fallback_body;
            if (!meta.image && l.fallback_image) meta.image = l.fallback_image;

            return { ...l, metadata: JSON.stringify(meta) };
        });

        const total = get("SELECT COUNT(*) as count FROM logs WHERE action = 'notification_sent'").count;
        res.json({ logs: processedLogs, total });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

router.get('/admin/broadcasts/:id/views', requireAdmin, (req, res) => {
    try {
        const views = all(`
            SELECT bv.*, u.nickname as user_nickname
            FROM broadcast_views bv
            LEFT JOIN users u ON bv.user_id = u.id
            WHERE bv.broadcast_id = ?
            ORDER BY bv.read_at DESC, bv.delivered_at DESC
        `, [req.params.id]);
        res.json({ views });
    } catch (error) {
        console.error('Broadcast views error:', error);
        res.status(500).json({ error: 'Failed to get broadcast views' });
    }
});

export default router;
