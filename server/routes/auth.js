import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db, { log } from '../database.js';

const router = Router();

// Register new user (anonymous with optional nickname)
router.post('/register', (req, res) => {
    const { deviceId, nickname } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    // Check if device already registered
    const existing = db.prepare('SELECT * FROM users WHERE device_id = ?').get(deviceId);

    if (existing) {
        log(existing.id, 'login', null, { method: 'existing_device' });
        return res.json({
            user: existing,
            isNew: false
        });
    }

    // Create new user
    const userId = uuidv4();

    db.prepare(`
    INSERT INTO users (id, device_id, nickname)
    VALUES (?, ?, ?)
  `).run(userId, deviceId, nickname || null);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    log(userId, 'register', null, { nickname });

    res.status(201).json({
        user,
        isNew: true
    });
});

// Update nickname
router.put('/nickname', (req, res) => {
    const userId = req.headers['x-user-id'];
    const { nickname } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    log(userId, 'update_nickname', null, { nickname });

    res.json({ user });
});

// Admin login
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create simple token (in production, use JWT)
    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64');

    res.json({
        token,
        admin: { id: admin.id, username: admin.username }
    });
});

export default router;
