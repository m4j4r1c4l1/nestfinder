import express from 'express';
import { getDb, run, get, all, log } from '../database.js';
import { requireAdmin, requireUser } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
import { calculateDevMetrics } from '../utils/devMetrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const router = express.Router();

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
// IN-APP NOTIFICATION ROUTES
// ========================================

// Get unread notifications AND seen broadcasts
router.get('/notifications', (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // 1. Get standard notifications
        const notifications = all(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        // 2. Get broadcasts seen by this user (joined with view record)
        const seenBroadcasts = all(`
            SELECT b.id, b.title, b.message as body, b.image_url, b.created_at,
                   v.status, v.delivered_at, v.read_at,
                   CASE WHEN v.status = 'read' THEN 1 ELSE 0 END as read,
                   'broadcast' as type
            FROM broadcasts b
            JOIN broadcast_views v ON b.id = v.broadcast_id
            WHERE v.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT 50
        `, [userId]);

        // 3. Get ACTIVE broadcasts NOT seen by this user (Brand new ones)
        // These effectively act as "Unread/New" notifications in the inbox
        const now = new Date().toISOString();
        const unseenBroadcasts = all(`
            SELECT b.id, b.title, b.message as body, b.image_url, b.created_at,
                   'sent' as status, NULL as delivered_at, NULL as read_at,
                   0 as read,
                   'broadcast' as type
            FROM broadcasts b
            WHERE datetime(b.start_time) <= datetime(?)
            AND datetime(b.end_time) >= datetime(?)
            AND b.id NOT IN (SELECT broadcast_id FROM broadcast_views WHERE user_id = ?)
            ORDER BY b.priority DESC, b.created_at DESC
            LIMIT 10
        `, [now, now, userId]);

        // 4. Merge and Sort
        const unified = [...notifications, ...seenBroadcasts, ...unseenBroadcasts].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        }).slice(0, 50);

        // Mark fetched *standard* notifications as delivered (if not already)
        // (Broadcasts handle their own delivery status in points.js)
        const undeliveredIds = notifications
            .filter(n => !n.delivered && n.type !== 'broadcast') // Double safety
            .map(n => n.id);

        if (undeliveredIds.length > 0) {
            run(
                `UPDATE notifications SET delivered = 1, delivered_at = CURRENT_TIMESTAMP WHERE id IN (${undeliveredIds.join(',')})`
            );
        }

        res.json({ notifications: unified });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Mark notification as read
router.post('/notifications/:id/read', (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        run(
            'UPDATE notifications SET read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Mark all as read
router.post('/notifications/read-all', (req, res) => {
    try {
        const { userId } = req.body;

        run(
            'UPDATE notifications SET read = 1 WHERE user_id = ?',
            [userId]
        );

        // Also mark all seen broadcasts as read
        run(
            "UPDATE broadcast_views SET status = 'read', read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status != 'read'",
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});
// Delete a notification (user action)
router.delete('/notifications/:id', requireUser, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Only delete if it belongs to this user
        const notification = get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
        log(userId, 'delete_notification', id.toString(), {});

        res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// ========================================
// ADMIN ROUTES
// ========================================

// Get notification templates
router.get('/admin/templates', requireAdmin, (req, res) => {
    res.json({ templates });
});

// Get subscriber stats (Adapted to count users since web push is removed)
router.get('/admin/stats', requireAdmin, async (req, res) => {
    try {
        // Count total users
        const total = get('SELECT COUNT(*) as count FROM users');

        // Get notification metrics
        const notificationCount = get('SELECT COUNT(*) as count FROM notifications');
        const unreadCount = get('SELECT COUNT(*) as count FROM notifications WHERE read = 0');

        // Get rating metrics
        const ratingStats = get(`
            SELECT SUM(total_ratings) as totalRatings, SUM(rating_sum) as ratingSum
            FROM daily_ratings
        `);
        const avgRating = ratingStats?.totalRatings > 0
            ? ratingStats.ratingSum / ratingStats.totalRatings
            : null;

        // Get feedback count
        const feedbackCount = get('SELECT COUNT(*) as count FROM feedback');

        // Get map point counts by status
        const confirmedPoints = get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['confirmed']);
        const pendingPoints = get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['pending']);
        const deactivatedPoints = get('SELECT COUNT(*) as count FROM points WHERE status = ?', ['deactivated']);

        // List recent active users
        const users = all(`
            SELECT id as user_id, nickname, created_at, last_active
            FROM users 
            ORDER BY last_active DESC 
            LIMIT 100
        `);

        // User Level Stats
        const eagleCount = get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 50');
        const owlCount = get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 30 AND trust_score < 50');
        const sparrowCount = get('SELECT COUNT(*) as count FROM users WHERE trust_score >= 10 AND trust_score < 30');
        const hatchlingCount = get('SELECT COUNT(*) as count FROM users WHERE (trust_score IS NULL OR trust_score < 10)');

        // Get feedback breakdown
        let feedbackTotal, feedbackPending, feedbackRead;
        try {
            feedbackTotal = get('SELECT COUNT(*) as count FROM feedback');
            feedbackPending = get("SELECT COUNT(*) as count FROM feedback WHERE status IN ('sent', 'delivered')");
            feedbackRead = get("SELECT COUNT(*) as count FROM feedback WHERE status = 'read'");
        } catch (e) {
            console.error('Feedback stats failed:', e.message);
            // Fallback if column missing (should be fixed by migration, but just in case)
            feedbackTotal = { count: 0 };
            feedbackPending = { count: 0 };
            feedbackRead = { count: 0 };
        }

        // 1. Dev Metrics
        const devMetrics = await calculateDevMetrics(rootDir);

        // Calculate Broadcast Metrics
        let broadcastMetrics = { total: 0, active: 0, delivered: 0, read: 0 };
        try {
            const totalBroadcasts = get('SELECT COUNT(*) as count FROM broadcasts');
            const activeBroadcasts = get("SELECT COUNT(*) as count FROM broadcasts WHERE end_time > datetime('now')");
            const deliveredBroadcasts = get("SELECT COUNT(*) as count FROM broadcast_views WHERE status IN ('delivered', 'read')");
            const readBroadcasts = get("SELECT COUNT(*) as count FROM broadcast_views WHERE status = 'read'");

            broadcastMetrics = {
                total: totalBroadcasts?.count || 0,
                active: activeBroadcasts?.count || 0,
                delivered: deliveredBroadcasts?.count || 0,
                read: readBroadcasts?.count || 0
            };
        } catch (err) {
            console.error('Broadcast metrics failed:', err);
        }

        res.json({
            totalSubscribers: total?.count || 0,
            subscribers: users,
            userLevels: {
                eagle: eagleCount?.count || 0,
                owl: owlCount?.count || 0,
                sparrow: sparrowCount?.count || 0,
                hatchling: hatchlingCount?.count || 0
            },
            devMetrics,
            broadcastMetrics,
            notificationMetrics: {
                total: notificationCount?.count || 0,
                unread: unreadCount?.count || 0
            },
            feedbackMetrics: { // added breakdown
                total: feedbackTotal?.count || 0,
                pending: feedbackPending?.count || 0,
                read: feedbackRead?.count || 0
            },
            avgRating: avgRating,
            totalRatings: ratingStats?.totalRatings || 0,
            totalReceived: feedbackTotal?.count || 0, // Keep for backward compat if needed, but UI uses feedbackMetrics now
            mapPoints: {
                confirmed: confirmedPoints?.count || 0,
                pending: pendingPoints?.count || 0,
                deactivated: deactivatedPoints?.count || 0
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});


// Send notification (In-App only)
router.post('/admin/send', requireAdmin, async (req, res) => {
    try {
        const { template, title, body, target, userIds, maxViews } = req.body;

        // Build notification payload
        let notificationTitle, notificationBody;

        if (template && templates[template]) {
            notificationTitle = templates[template].title;
            notificationBody = body || templates[template].body;
        } else {
            notificationTitle = title || 'NestFinder';
            notificationBody = body || 'You have a new notification';
        }

        // Determine target users
        let targetUserIds = [];
        if (target === 'all') {
            const allUsers = all('SELECT id FROM users');
            targetUserIds = allUsers.map(u => u.id);
        } else if (target === 'selected' && userIds && userIds.length > 0) {
            targetUserIds = userIds;
        } else if (target === 'one' && userIds && userIds.length === 1) {
            targetUserIds = userIds;
        } else {
            return res.status(400).json({ error: 'Invalid target specification' });
        }

        if (targetUserIds.length === 0) {
            return res.status(404).json({ error: 'No users found for target' });
        }

        // Enforce Max Views Limit (if specified)
        if (maxViews && !isNaN(maxViews) && parseInt(maxViews) > 0) {
            const limit = parseInt(maxViews);
            if (targetUserIds.length > limit) {
                // Shuffle array to ensure random distribution for fairness
                for (let i = targetUserIds.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [targetUserIds[i], targetUserIds[j]] = [targetUserIds[j], targetUserIds[i]];
                }
                targetUserIds = targetUserIds.slice(0, limit);
            }
        }

        // Generate a batch ID for this broadcast
        const batchId = Date.now().toString(36) + Math.random().toString(36).substring(2);

        // Insert notifications for each user
        const stmt = getDb().prepare('INSERT INTO notifications (user_id, title, body, type, image_url, read, delivered, batch_id) VALUES (?, ?, ?, ?, ?, 0, 0, ?)');
        const type = template || 'custom';
        const image = req.body.imageUrl || null;

        targetUserIds.forEach(uid => {
            stmt.run([uid, notificationTitle, notificationBody, type, image, batchId]);
        });
        stmt.free();

        log('admin', 'notification_sent', batchId, {
            template,
            target,
            count: targetUserIds.length,
            title: notificationTitle,
            body: notificationBody,
            image: image,
            isShareApp: template === 'share_app' // Helpful flag
        });

        res.json({
            success: true,
            sent: targetUserIds.length,
            message: `Notification sent to ${targetUserIds.length} users`
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Clear all notifications (admin only)
router.delete('/admin/notifications/clear-all', requireAdmin, (req, res) => {
    try {
        const result = run('DELETE FROM notifications');

        log('admin', 'notifications_cleared', null, {
            deletedCount: result.changes || 0
        });

        res.json({
            success: true,
            message: `Cleared ${result.changes || 0} notification(s)`,
            deleted: result.changes || 0
        });
    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

// Get batch details (for Admin "Message Details" view)
router.get('/admin/notifications/batch/:batchId', requireAdmin, (req, res) => {
    try {
        const { batchId } = req.params;

        // Get notifications in this batch joined with users
        const rows = all(`
            SELECT 
                n.id, n.user_id, n.read, n.delivered, n.created_at, n.delivered_at, n.read_at,
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

// Get notification history (logs)
// Get notification history (logs)
router.get('/admin/notifications/history', requireAdmin, (req, res) => {
    try {
        const { page = 1, limit = 50, sort = 'created_at', dir = 'desc' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const direction = dir === 'asc' ? 'ASC' : 'DESC';

        // Map sort keys to DB columns or JSON paths
        let orderBy = 'created_at';
        if (sort === 'title') orderBy = "json_extract(metadata, '$.title')";
        else if (sort === 'body') orderBy = "json_extract(metadata, '$.body')";
        else if (sort === 'target') orderBy = "json_extract(metadata, '$.count')"; // Sort by target count
        else if (sort === 'image') orderBy = "json_extract(metadata, '$.image')";

        const logs = all(
            `SELECT l.*, 
                (SELECT COUNT(*) FROM notifications n WHERE n.batch_id = l.target_id AND n.read = 1) as read_count, 
                (SELECT COUNT(*) FROM notifications n WHERE n.batch_id = l.target_id AND n.delivered = 1) as delivered_count
             FROM logs l
             WHERE l.action = 'notification_sent' 
             ORDER BY ${orderBy} ${direction} 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const total = get("SELECT COUNT(*) as count FROM logs WHERE action = 'notification_sent'").count;

        res.json({ logs, total });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

// Prune old notifications
router.delete('/prune', requireUser, (req, res) => {
    const { cutoff } = req.body;
    if (!cutoff) return res.status(400).json({ error: 'Cutoff date required' });

    const userId = req.user.id;

    run(`
    DELETE FROM notifications 
    WHERE user_id = ? AND created_at < ?
  `, [userId, cutoff]);

    res.json({ success: true, message: 'Notifications pruned' });
});

// Delete individual notification
router.delete('/:id', requireUser, (req, res) => {
    const userId = req.user.id;

    run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ success: true });
});

// Get broadcast interaction details
router.get('/admin/broadcasts/:id/views', requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const views = all(`
            SELECT 
                bv.*,
                u.nickname as user_nickname
            FROM broadcast_views bv
            LEFT JOIN users u ON bv.user_id = u.id
            WHERE bv.broadcast_id = ?
            ORDER BY 
                CASE 
                    WHEN bv.status = 'read' THEN 1 
                    WHEN bv.status = 'delivered' THEN 2 
                    ELSE 3 
                END ASC,
                bv.read_at DESC, bv.delivered_at DESC
        `, [id]);

        res.json({ views });
    } catch (error) {
        console.error('Broadcast views error:', error);
        res.status(500).json({ error: 'Failed to get broadcast views' });
    }
});

export default router;
