import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get, log } from '../database.js';

const router = Router();

// JWT secret - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'nestfinder-admin-secret-change-in-production';
const JWT_EXPIRATION = '24h';

// Register new user (anonymous with optional nickname)
router.post('/register', (req, res) => {
    const { deviceId, nickname } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    // Check if device already registered
    const existing = get('SELECT * FROM users WHERE device_id = ?', [deviceId]);

    if (existing) {
        log(existing.id, 'login', null, { method: 'existing_device' });
        return res.json({
            user: existing,
            isNew: false
        });
    }

    // Create new user
    const userId = uuidv4();

    run(
        `INSERT INTO users (id, device_id, nickname) VALUES (?, ?, ?)`,
        [userId, deviceId, nickname || null]
    );

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

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

    run('UPDATE users SET nickname = ? WHERE id = ?', [nickname, userId]);

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    log(userId, 'update_nickname', null, { nickname });

    res.json({ user });
});

// Admin login
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = get('SELECT * FROM admins WHERE username = ?', [username]);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token with expiration
    const token = jwt.sign(
        {
            adminId: admin.id,
            username: admin.username
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );

    log('admin', 'admin_login', null, { username: admin.username });

    res.json({
        token,
        admin: { id: admin.id, username: admin.username },
        expiresIn: JWT_EXPIRATION
    });
});

// Export JWT_SECRET for middleware
export { JWT_SECRET };
export default router;
