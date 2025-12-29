import jwt from 'jsonwebtoken';
import { get } from '../database.js';
import { NEST_INTEGRITY } from '../routes/auth.js';

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

// Middleware to verify admin with JWT
export const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Admin authorization required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify JWT token - automatically checks expiration
        const decoded = jwt.verify(token, NEST_INTEGRITY);

        // Verify admin still exists in database
        const admin = get('SELECT * FROM admins WHERE id = ?', [decoded.adminId]);

        if (!admin) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired, please login again' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
