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

// Dynamic configuration cache
let limitConfig = {
    api_global: 120,
    registration: 10,
    point_submission: 20,
    voting: 30,
    admin_login: 5
};

// Function to update limits from database settings
export const updateLimitConfig = (settings) => {
    if (settings.rate_limit_global) limitConfig.api_global = parseInt(settings.rate_limit_global, 10);
    if (settings.rate_limit_register) limitConfig.registration = parseInt(settings.rate_limit_register, 10);
    if (settings.rate_limit_submit) limitConfig.point_submission = parseInt(settings.rate_limit_submit, 10);
    if (settings.rate_limit_vote) limitConfig.voting = parseInt(settings.rate_limit_vote, 10);
    if (settings.rate_limit_admin_login) limitConfig.admin_login = parseInt(settings.rate_limit_admin_login, 10);
    console.log('🛡️ Rate limits updated:', limitConfig);
};

// Rate limiter for admin login
export const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: () => limitConfig.admin_login, // Dynamic limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again after 15 minutes' },
    handler: (req, res, next, options) => {
        logRateLimitHit('admin_login', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Global API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: () => limitConfig.api_global, // Dynamic limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down' },
    handler: (req, res, next, options) => {
        logRateLimitHit('api_global', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Stricter limiter for registration
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: () => limitConfig.registration, // Dynamic limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registrations, please try again later' },
    handler: (req, res, next, options) => {
        logRateLimitHit('registration', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Stricter limiter for point submissions
export const submitPointLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: () => limitConfig.point_submission, // Dynamic limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many point submissions, please try again later' },
    handler: (req, res, next, options) => {
        logRateLimitHit('point_submission', req);
        res.status(options.statusCode).json(options.message);
    }
});

// Limiter for voting actions
export const voteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: () => limitConfig.voting, // Dynamic limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many votes, please try again later' },
    handler: (req, res, next, options) => {
        logRateLimitHit('voting', req);
        res.status(options.statusCode).json(options.message);
    }
});
