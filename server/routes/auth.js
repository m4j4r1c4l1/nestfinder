import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get, log } from '../database.js';
import { adminLoginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// JWT secret - use environment variable in production
const NEST_INTEGRITY = process.env.NEST_INTEGRITY || 'nestfinder-admin-secret-change-in-production';
const JWT_EXPIRATION = '24h';
const USER_TOKEN_EXPIRATION = '30d'; // User tokens last longer

// Helper to generate user token
const generateUserToken = (userId) => {
    return jwt.sign(
        { userId, type: 'user' },
        NEST_INTEGRITY,
        { expiresIn: USER_TOKEN_EXPIRATION }
    );
};

// Register new user (anonymous with optional nickname)
router.post('/register', registerLimiter, (req, res) => {
    const { deviceId, nickname } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    // Check if device already registered
    const existing = get('SELECT * FROM users WHERE device_id = ?', [deviceId]);

    if (existing) {
        log(existing.id, 'login', null, { method: 'existing_device' });

        // Generate token for returning user
        const token = generateUserToken(existing.id);

        return res.json({
            user: existing,
            token,
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

    // Generate token for new user
    const token = generateUserToken(userId);

    res.status(201).json({
        user,
        token,
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
// Admin login with rate limiting
router.post('/admin/login', adminLoginLimiter, (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = get('SELECT * FROM admins WHERE username = ?', [username]);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
        // Log failed attempt with security metadata
        log('admin', 'admin_login_failed', null, {
            username,
            ip,
            userAgent,
            reason: 'Invalid credentials'
        });
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token with expiration
    const token = jwt.sign(
        {
            adminId: admin.id,
            username: admin.username
        },
        NEST_INTEGRITY,
        { expiresIn: JWT_EXPIRATION }
    );

    // Log successful login with security metadata
    log('admin', 'admin_login', null, {
        username: admin.username,
        ip,
        userAgent
    });

    res.json({
        token,
        admin: { id: admin.id, username: admin.username },
        expiresIn: JWT_EXPIRATION
    });
});

// Export JWT_SECRET for middleware
export { NEST_INTEGRITY };
export default router;
