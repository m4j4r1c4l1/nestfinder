import jwt from 'jsonwebtoken';
import { get, run } from '../database.js';
import { NEST_INTEGRITY } from '../routes/auth.js';

// Middleware to verify user with JWT token
export const requireUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Try JWT token first (preferred)
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, NEST_INTEGRITY);

            // Check it's a user token (not admin)
            if (decoded.type !== 'user') {
                return res.status(401).json({ error: 'Invalid token type' });
            }

            const user = get('SELECT * FROM users WHERE id = ?', [decoded.userId]);

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // Update last active
            run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [decoded.userId]);

            req.user = user;
            return next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired, please re-register' });
            }
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    // No valid JWT provided - reject request
    return res.status(401).json({ error: 'Authorization required. Please login.' });
};

// Middleware to verify admin with JWT
export const requireAdmin = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Admin authorization required' });
    }

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
