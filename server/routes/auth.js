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

// ================== RECOVERY KEY SYSTEM ==================

// Word list for 3-word recovery keys (110 words = ~130k combinations)
const RECOVERY_WORDS = [
    'nest', 'bird', 'wing', 'feather', 'sky', 'tree', 'branch', 'leaf', 'forest', 'meadow',
    'river', 'stream', 'lake', 'ocean', 'wave', 'cloud', 'rain', 'storm', 'sun', 'moon',
    'star', 'dawn', 'dusk', 'night', 'day', 'spring', 'summer', 'autumn', 'winter', 'frost',
    'snow', 'wind', 'breeze', 'thunder', 'lightning', 'rainbow', 'mountain', 'valley', 'hill', 'cliff',
    'cave', 'rock', 'stone', 'sand', 'grass', 'flower', 'bloom', 'seed', 'root', 'bark',
    'eagle', 'hawk', 'owl', 'sparrow', 'robin', 'crow', 'dove', 'swan', 'heron', 'finch',
    'fox', 'wolf', 'bear', 'deer', 'rabbit', 'squirrel', 'beaver', 'otter', 'badger', 'owl',
    'heart', 'hope', 'trust', 'faith', 'love', 'care', 'help', 'home', 'haven', 'shelter',
    'warm', 'safe', 'calm', 'peace', 'kind', 'bold', 'brave', 'wise', 'free', 'true',
    'bright', 'soft', 'gentle', 'strong', 'swift', 'quiet', 'still', 'clear', 'fresh', 'new',
    'gold', 'silver', 'copper', 'iron', 'amber', 'jade', 'ruby', 'pearl', 'crystal', 'diamond'
];

// Generate a 3-word recovery key
const generateRecoveryKey = () => {
    const words = [];
    for (let i = 0; i < 3; i++) {
        const index = Math.floor(Math.random() * RECOVERY_WORDS.length);
        words.push(RECOVERY_WORDS[index]);
    }
    return words.join('-');
};

// Generate recovery key for user
router.post('/recovery-key', (req, res) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // If already has key, return it
    if (user.recovery_key) {
        return res.json({ recoveryKey: user.recovery_key });
    }

    // Generate new key
    const recoveryKey = generateRecoveryKey();
    run('UPDATE users SET recovery_key = ? WHERE id = ?', [recoveryKey, userId]);

    log(userId, 'recovery_key_generated');

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
    run('UPDATE users SET device_id = ? WHERE id = ?', [deviceId, user.id]);

    const updatedUser = get('SELECT * FROM users WHERE id = ?', [user.id]);
    const token = generateUserToken(updatedUser.id);

    log(updatedUser.id, 'identity_recovered', null, { newDeviceId: deviceId });

    res.json({
        user: updatedUser,
        token,
        message: 'Identity recovered successfully'
    });
});

// Export JWT_SECRET for middleware
export { NEST_INTEGRITY };
export default router;
