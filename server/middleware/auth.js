import { get } from '../database.js';

// Middleware to verify user exists
export const requireUser = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
        return res.status(401).json({ error: 'Invalid user' });
    }

    // Update last active (fire and forget)
    import('../database.js').then(db => {
        db.run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    });

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
        const admin = get('SELECT * FROM admins WHERE id = ?', [parseInt(adminId)]);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid admin token' });
        }

        req.admin = admin;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token format' });
    }
};
