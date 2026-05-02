const xss = require('xss');

/**
 * Middleware to sanitize all request inputs to prevent XSS attacks
 * Strips dangerous HTML/script tags from all string values
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return xss(obj, {
                whiteList: {}, // No tags allowed
                stripIgnoredTag: true,
                stripLeakage: true
            });
        }
        if (Array.isArray(obj)) {
            return obj.map(item => sanitizeObject(item));
        }
        if (obj !== null && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };

    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
};

module.exports = sanitizeInput;
