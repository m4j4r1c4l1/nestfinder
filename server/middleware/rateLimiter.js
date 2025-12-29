import rateLimit from 'express-rate-limit';

// Rate limiter for admin login
// Block triggers after 5 failed attempts from same IP in 15 minutes
export const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    // Return rate limit info in the RateLimit-* headers
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts, please try again after 15 minutes'
    },
    // Adding skipSuccessfulRequests option would be nice but isn't standard in basic config
    // We want to limit ATTEMPTS regardless of success to prevent probing
});
