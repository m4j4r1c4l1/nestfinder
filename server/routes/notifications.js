import express from 'express';
import { requireAdmin, requireUser } from '../middleware/auth.js';

const router = express.Router();

// WebSocket broadcast function (injected from index.js)
// We keep this signature for index.js compatibility
export const setBroadcast = (fn) => { };

// ========================================
// LEGACY PUSH/NOTIFICATION ALIASES (Deprecated)
// Routes below migrated to messages.js router
// ========================================

// 1. User Notification Routes
router.get('/notifications', requireUser, (req, res) => {
    res.redirect(307, '/api/messages/notifications');
});

router.post('/notifications/:id/read', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/notifications/${req.params.id}/read`);
});

router.post('/notifications/:id/delivered', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/notifications/${req.params.id}/delivered`);
});

router.post('/notifications/read-all', requireUser, (req, res) => {
    res.redirect(307, '/api/messages/notifications/read-all');
});

router.delete('/notifications/:id', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/notifications/${req.params.id}`);
});

router.delete('/prune', requireUser, (req, res) => {
    res.redirect(307, '/api/messages/notifications/prune');
});

// 2. Broadcast interaction routes (Aliased from old /api/push paths)
router.post('/broadcasts/:id/sent', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/broadcasts/${req.params.id}/sent`);
});

router.post('/broadcasts/:id/delivered', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/broadcasts/${req.params.id}/delivered`);
});

router.post('/broadcasts/:id/read', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/broadcasts/${req.params.id}/read`);
});

router.delete('/broadcasts/:id', requireUser, (req, res) => {
    res.redirect(307, `/api/messages/broadcasts/${req.params.id}`);
});

// 3. Admin Routes
router.get('/admin/stats', requireAdmin, (req, res) => {
    res.redirect(307, '/api/messages/admin/stats');
});

router.post('/admin/send', requireAdmin, (req, res) => {
    res.redirect(307, '/api/messages/admin/send');
});

router.get('/admin/notifications/history', requireAdmin, (req, res) => {
    res.redirect(307, '/api/messages/admin/notifications/history');
});

router.get('/admin/broadcasts/:id/views', requireAdmin, (req, res) => {
    res.redirect(307, `/api/messages/admin/broadcasts/${req.params.id}/views`);
});

export default router;
