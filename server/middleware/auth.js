import db from '../database.js';

// Middleware to verify user exists
export const requireUser = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
        return res.status(401).json({ error: 'Invalid user' });
    }

    // Update last active
    db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

    req.user = user;
    next();
};

// Middleware to verify admin
export const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Admin authorization required' });
    }

    const token = authHeader.split(' ')[1];

    // Simple token validation - in production use JWT
    try {
        const [adminId, timestamp] = Buffer.from(token, 'base64').toString().split(':');
        const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid admin token' });
        }

        req.admin = admin;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token format' });
    }
};
