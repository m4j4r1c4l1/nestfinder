import express from 'express';
import webPush from 'web-push';
import { getDb, run, get, all, log, getSetting } from '../database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get VAPID keys from database
const getVapidConfig = () => {
    return {
        publicKey: getSetting('vapid_public_key'),
        privateKey: getSetting('vapid_private_key'),
        subject: getSetting('vapid_subject') || 'mailto:m4j4r1.c4l1@gmail.com'
    };
};

// Configure web-push lazily (keys read from database)
let vapidConfigured = false;
const ensureVapidConfigured = () => {
    if (!vapidConfigured) {
        const { publicKey, privateKey, subject } = getVapidConfig();
        if (publicKey && privateKey && !publicKey.startsWith('XXX')) {
            webPush.setVapidDetails(subject, publicKey, privateKey);
            vapidConfigured = true;
            return true;
        }
        return false;
    }
    return true;
};

// Notification templates
const templates = {
    new_points: {
        title: '🐦 New Locations Reported',
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
// PUBLIC ROUTES (for clients)
// ========================================

// Get VAPID public key (for client subscription)
router.get('/vapid-public-key', (req, res) => {
    const { publicKey } = getVapidConfig();
    if (!publicKey || publicKey.startsWith('XXX')) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }
    res.json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', (req, res) => {
    try {
        const { subscription, userId } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Invalid subscription data' });
        }

        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys;

        // Insert or update subscription (upsert by endpoint)
        const existing = get('SELECT id FROM push_subscriptions WHERE endpoint = ?', [endpoint]);

        if (existing) {
            run(
                `UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE endpoint = ?`,
                [userId || 'anonymous', p256dh, auth, endpoint]
            );
        } else {
            run(
                `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`,
                [userId || 'anonymous', endpoint, p256dh, auth]
            );
        }

        log(userId, 'push_subscribe', null, { endpoint: endpoint.substring(0, 50) });
        res.json({ success: true, message: 'Subscription saved' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint required' });
        }

        run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
        res.json({ success: true, message: 'Unsubscribed' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

// ========================================
// ADMIN ROUTES
// ========================================

// Get notification templates
router.get('/admin/templates', requireAdmin, (req, res) => {
    res.json({ templates });
});

// Get subscriber stats
router.get('/admin/stats', requireAdmin, (req, res) => {
    try {
        const total = get('SELECT COUNT(*) as count FROM push_subscriptions');
        const users = all(`
            SELECT ps.user_id, u.nickname, ps.created_at 
            FROM push_subscriptions ps
            LEFT JOIN users u ON ps.user_id = u.id
            ORDER BY ps.created_at DESC
            LIMIT 100
        `);

        res.json({
            totalSubscribers: total?.count || 0,
            subscribers: users
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Send notification
router.post('/admin/send', requireAdmin, async (req, res) => {
    try {
        // Ensure VAPID is configured
        if (!ensureVapidConfigured()) {
            return res.status(503).json({ error: 'Push notifications not configured. Set VAPID keys in database.' });
        }

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

        const payload = JSON.stringify({
            title: notificationTitle,
            body: notificationBody,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            data: { url: '/', type: template || 'custom' }
        });

        // Get target subscriptions
        let subscriptions;

        if (target === 'all') {
            subscriptions = all('SELECT * FROM push_subscriptions');
        } else if (target === 'selected' && userIds && userIds.length > 0) {
            const placeholders = userIds.map(() => '?').join(',');
            subscriptions = all(
                `SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`,
                userIds
            );
        } else if (target === 'one' && userIds && userIds.length === 1) {
            subscriptions = all(
                'SELECT * FROM push_subscriptions WHERE user_id = ?',
                [userIds[0]]
            );
        } else {
            return res.status(400).json({ error: 'Invalid target specification' });
        }

        if (subscriptions.length === 0) {
            return res.status(404).json({ error: 'No subscribers found for target' });
        }

        // Send to all target subscriptions
        let successCount = 0;
        let failCount = 0;
        const failedEndpoints = [];

        for (const sub of subscriptions) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webPush.sendNotification(pushSubscription, payload);
                successCount++;
            } catch (err) {
                console.error('Push failed for:', sub.endpoint.substring(0, 50), err.message);
                failCount++;

                // If subscription is expired/invalid, remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    run('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                    failedEndpoints.push(sub.endpoint);
                }
            }
        }

        log('admin', 'push_notification_sent', null, {
            template,
            target,
            successCount,
            failCount
        });

        res.json({
            success: true,
            sent: successCount,
            failed: failCount,
            message: `Notification sent to ${successCount} subscriber(s)`
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

export default router;
