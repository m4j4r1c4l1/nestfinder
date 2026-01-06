
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { run, get, log } from '../database.js';
import { requireUser } from '../middleware/auth.js';

const router = express.Router();
const NEST_INTEGRITY = process.env.NEST_INTEGRITY || 'default-secret-key';
const USER_TOKEN_EXPIRATION = '90d'; // 3 months

// Helper to generate user token
const generateUserToken = (userId) => {
    return jwt.sign(
        { userId, type: 'user' },
        NEST_INTEGRITY,
        { expiresIn: USER_TOKEN_EXPIRATION }
    );
};

// Admin Login
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    // Capture security metadata
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

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

    // Generate Admin Token (expires in 12h)
    const token = jwt.sign(
        { adminId: admin.id, type: 'admin', username: admin.username },
        NEST_INTEGRITY,
        { expiresIn: '12h' }
    );

    // Log successful login with security metadata
    log('admin', 'admin_login', admin.id.toString(), {
        username: admin.username,
        ip,
        userAgent
    });

    res.json({
        token,
        username: admin.username
    });
});

// Register guest user
router.post('/register', (req, res) => {
    const { deviceId, nickname } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    // Check if user exists with this deviceId
    const existing = get('SELECT * FROM users WHERE device_id = ?', [deviceId]);

    if (existing) {
        // If nickname provided and different, update it
        if (nickname && existing.nickname !== nickname) {
            run('UPDATE users SET nickname = ? WHERE id = ?', [nickname, existing.id]);
            existing.nickname = nickname;
        }

        const token = generateUserToken(existing.id);

        log(existing.id, 'login', null, { deviceId });

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

    // Don't send recovery_key (if any) to client, just the flag
    const userResponse = { ...user, has_recovery_key: !!user.recovery_key };
    delete userResponse.recovery_key;

    res.status(201).json({
        user: userResponse,
        token,
        isNew: true
    });
});

// Update nickname
router.put('/nickname', requireUser, (req, res) => {
    const { nickname } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!nickname || nickname.trim().length === 0) {
        return res.status(400).json({ error: 'Nickname required' });
    }

    run('UPDATE users SET nickname = ? WHERE id = ?', [nickname.trim(), userId]);

    const updatedUser = get('SELECT * FROM users WHERE id = ?', [userId]);

    log(userId, 'update_profile', null, { newNickname: nickname });

    res.json({
        user: updatedUser,
        message: 'Nickname updated'
    });
});

// Generate recovery key
router.post('/generate-key', requireUser, (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // List of simple words for key generation
    const words = [
        'apple', 'blue', 'bird', 'cloud', 'dream', 'earth', 'fire', 'green', 'hope', 'ice',
        'joy', 'king', 'leaf', 'moon', 'night', 'ocean', 'peace', 'queen', 'rain', 'sky',
        'star', 'tree', 'wind', 'wolf', 'year', 'zen', 'art', 'book', 'cup', 'door',
        'eye', 'fish', 'gold', 'hat', 'ink', 'jazz', 'kite', 'lion', 'map', 'nest',
        'owl', 'park', 'quest', 'road', 'sea', 'time', 'urn', 'voice', 'wing', 'yarn'
    ];

    // Generate 3 random words
    const keyWords = [];
    for (let i = 0; i < 3; i++) {
        keyWords.push(words[Math.floor(Math.random() * words.length)]);
    }
    const recoveryKey = keyWords.join('-');

    // Save to database
    // We store plain text for this MVP as requested, but in production this should be hashed
    run('UPDATE users SET recovery_key = ? WHERE id = ?', [recoveryKey, userId]);

    log(userId, 'generate_key', null, {});

    res.json({ recoveryKey });
});

// Recover identity using key
router.post('/recover', (req, res) => {
    const { recoveryKey, deviceId } = req.body;

    if (!recoveryKey || !deviceId) {
        return res.status(400).json({ error: 'Recovery key and device ID required' });
    }

    const normalizedKey = recoveryKey.toLowerCase().trim().replace(/\s+/g, '-');
    const user = get('SELECT * FROM users WHERE recovery_key = ?', [normalizedKey]);

    if (!user) {
        return res.status(404).json({ error: 'Invalid recovery key' });
    }

    // Update device_id to new device
    // First, assign a new unique device_id to any existing user with this device
    // This effectively "logs out" the previous user from this device
    // We use a 'displaced-' prefix to avoid conflicts and make it easy to identify
    const displacedDeviceId = 'displaced-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    run('UPDATE users SET device_id = ? WHERE device_id = ?', [displacedDeviceId, deviceId]);
    run('UPDATE users SET device_id = ? WHERE id = ?', [deviceId, user.id]);

    const updatedUser = get('SELECT * FROM users WHERE id = ?', [user.id]);
    const token = generateUserToken(updatedUser.id);

    log(updatedUser.id, 'identity_recovered', null, { newDeviceId: deviceId });

    // Don't send recovery_key (if any) to client, just the flag
    const userResponse = { ...updatedUser, has_recovery_key: !!updatedUser.recovery_key };
    delete userResponse.recovery_key;

    res.json({
        user: userResponse,
        token,
        message: 'Identity recovered successfully'
    });
});

// Export JWT_SECRET for middleware
export { NEST_INTEGRITY };

export default router;
