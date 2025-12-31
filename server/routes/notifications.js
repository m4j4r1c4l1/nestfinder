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

        // Insert notifications for each user
        const stmt = getDb().prepare('INSERT INTO notifications (user_id, title, body, type, image_url, read) VALUES (?, ?, ?, ?, ?, 0)');
        const type = template || 'custom';
        const image = req.body.imageUrl || null;

        targetUserIds.forEach(uid => {
            stmt.run([uid, notificationTitle, notificationBody, type, image]);
        });
        stmt.free();

        log('admin', 'notification_sent', null, {
            template,
            target,
            count: targetUserIds.length
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

export default router;
