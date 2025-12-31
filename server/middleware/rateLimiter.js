import rateLimit from 'express-rate-limit';
import { log } from '../database.js';

// Helper to log rate limit events to system logs
const logRateLimitHit = (type, req) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = req.headers['x-user-id'] || null;
    const path = req.originalUrl || req.path;

    log('system', 'rate_limit_exceeded', null, {
        type,
        ip,
        path,
        userAgent,
        userId
    });

    console.warn(`⚠️ Rate limit exceeded [${type}]: IP=${ip}, Path=${path}`);
};

// Rate limiter for admin login
// Block after 5 failed attempts from same IP in 15 minutes
export const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again after 15 minutes' },
    handler: (req, res, next, options) => {
        logRateLimitHit('admin_login', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Global API rate limiter - 60 requests per minute per IP
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down' },
    handler: (req, res, next, options) => {
        logRateLimitHit('api_global', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Stricter limiter for registration - 10 per hour per IP
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registrations, please try again later' },
    handler: (req, res, next, options) => {
        logRateLimitHit('registration', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Stricter limiter for point submissions - 20 per hour per IP
export const submitPointLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many point submissions, please try again later' },
    handler: (req, res, next, options) => {
        logRateLimitHit('point_submission', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Limiter for voting actions (confirm/deactivate) - 30 per hour per IP
export const voteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many votes, please try again later' },
    handler: (req, res, next, options) => {
        logRateLimitHit('voting', req);
        res.status(options.statusCode).json(options.message);
    }
});
