import { rateLimit } from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again in 15 minutes.",
    },
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});