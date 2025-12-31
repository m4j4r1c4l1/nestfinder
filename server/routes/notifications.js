import express from 'express';
import { getDb, run, get, all, log } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

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

// Get unread notifications
router.get('/notifications', (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const notifications = all(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        // Mark fetched notifications as delivered (if not already)
        // This provides the "Double Tick" status
        const undeliveredIds = notifications.filter(n => !n.delivered).map(n => n.id);
        if (undeliveredIds.length > 0) {
            run(
                `UPDATE notifications SET delivered = 1 WHERE id IN (${undeliveredIds.join(',')})`
            );
        }

        res.json({ notifications });
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
            'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
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

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
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
router.get('/admin/stats', requireAdmin, (req, res) => {
    try {
        // Count total users
        const total = get('SELECT COUNT(*) as count FROM users');

        // Get notification metrics
        const notificationCount = get('SELECT COUNT(*) as count FROM notifications');
        const unreadCount = get('SELECT COUNT(*) as count FROM notifications WHERE read = 0');

        // List recent active users
        const users = all(`
            SELECT id as user_id, nickname, created_at, last_active
            FROM users 
            ORDER BY last_active DESC 
            LIMIT 100
        `);

        res.json({
            totalSubscribers: total?.count || 0,
            subscribers: users,
            notificationMetrics: {
                total: notificationCount?.count || 0,
                unread: unreadCount?.count || 0
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
        const { template, title, body, target, userIds } = req.body;

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
            title: notificationTitle
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
                n.id, n.user_id, n.read, n.delivered, n.created_at,
                u.nickname, u.device_id
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE n.batch_id = ?
            ORDER BY n.read DESC, n.delivered DESC
        `, [batchId]);

        // Calculate stats
        const stats = {
            total: rows.length,
            delivered: rows.filter(r => r.delivered).length,
            read: rows.filter(r => r.read).length
        };

        res.json({ messages: rows, stats });
    } catch (error) {
        console.error('Batch details error:', error);
        res.status(500).json({ error: 'Failed to get batch details' });
    }
});

// Clean up invalid logs (admin only)
router.post('/admin/notifications/cleanup', requireAdmin, (req, res) => {
    try {
        // 1. Delete logs with null/empty target_id
        const res1 = run(`DELETE FROM logs WHERE action = 'notification_sent' AND (target_id IS NULL OR target_id = '')`);

        // 2. Delete orphaned logs (valid ID but no corresponding notification records)
        // This handles cases where notifications were deleted but logs remain
        const res2 = run(`
            DELETE FROM logs 
            WHERE action = 'notification_sent' 
            AND target_id NOT IN (SELECT DISTINCT batch_id FROM notifications WHERE batch_id IS NOT NULL)
        `);

        log('admin', 'logs_cleanup', null, {
            deletedInvalid: res1?.changes || 0,
            deletedOrphaned: res2?.changes || 0
        });

        res.json({
            success: true,
            message: `Cleanup complete. Removed ${res1?.changes || 0} invalid and ${res2?.changes || 0} orphaned entries.`,
            stats: {
                invalid: res1?.changes || 0,
                orphaned: res2?.changes || 0
            }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Failed to cleanup logs' });
    }
});

// Get notification history (logs)
router.get('/admin/notifications/history', requireAdmin, (req, res) => {
    try {
        const logs = all(
            `SELECT * FROM logs 
             WHERE action = 'notification_sent' 
             ORDER BY created_at DESC 
             LIMIT 50`
        );
        res.json({ logs });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

export default router;
