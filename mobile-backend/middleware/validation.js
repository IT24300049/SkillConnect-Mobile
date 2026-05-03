const { body, validationResult } = require('express-validator');

// Validation schemas
const authValidation = {
    register: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?])/)
            .withMessage('Password must be at least 8 characters with uppercase, lowercase, a number, and a symbol'),
        body('firstName')
            .trim()
            .isLength({ min: 2 })
            .withMessage('First name must be at least 2 characters'),
        body('lastName')
            .optional()
            .trim(),
        body('phone')
            .optional()
            .trim()
            .matches(/^\d{10,}$/)
            .withMessage('Phone must contain at least 10 digits'),
        body('role')
            .optional()
            .isIn(['customer', 'worker', 'supplier', 'admin'])
            .withMessage('Invalid role')
    ],
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ]
};

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// Sanitization helpers
const sanitizeJobData = (data) => {
    const allowed = ['jobTitle', 'jobDescription', 'category', 'locationAddress', 'city', 'district',
                     'urgencyLevel', 'budgetMin', 'budgetMax', 'estimatedDurationHours', 'preferredStartDate'];
    const sanitized = {};
    allowed.forEach(field => {
        if (data[field] !== undefined) sanitized[field] = data[field];
    });
    return sanitized;
};

const sanitizeBookingData = (data) => {
    const allowed = ['worker', 'job', 'scheduledDate', 'scheduledTime', 'estimatedDurationHours', 'notes'];
    const sanitized = {};
    allowed.forEach(field => {
        if (data[field] !== undefined) sanitized[field] = data[field];
    });
    return sanitized;
};

const sanitizeProfileData = (data) => {
    const allowed = ['firstName', 'lastName', 'phone', 'district', 'city', 'skills', 'bio', 'hourlyRate', 'experience', 'companyName'];
    const sanitized = {};
    allowed.forEach(field => {
        if (data[field] !== undefined) sanitized[field] = data[field];
    });
    return sanitized;
};

module.exports = {
    authValidation,
    validate,
    sanitizeJobData,
    sanitizeBookingData,
    sanitizeProfileData
};
