import rateLimit from "express-rate-limit";

// Rate limiter for authentication endpoints (login and register)
// Limits clients to 10 attempts per 15-minute window to prevent brute force
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true, // Draft-6 RateLimit headers (RateLimit-Policy, RateLimit-Limit, etc.)
    legacyHeaders: false, // Disable X-RateLimit-* headers
    statusCode: 429,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes."
    }
});
