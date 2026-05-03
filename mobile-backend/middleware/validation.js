const { body, validationResult } = require('express-validator');

// Validation schemas
const authValidation = {
    register: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        // Password Validation: 
        // 1. Minimum 8 characters long
        // 2. Must contain: 1 lowercase, 1 uppercase, 1 digit, and 1 special symbol (!@# etc.)
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?])/)
            .withMessage('Password must be at least 8 characters with uppercase, lowercase, a number, and a symbol'),
        body('firstName')
            .trim()
            .isLength({ min: 2 })
            .withMessage('First name must be at least 2 characters'),
        body('lastName')
            .optional({ checkFalsy: true })
            .trim(),
        body('phone')
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^\d{10}$/)
            .withMessage('Phone must be exactly 10 digits'),
        body('role')
            .optional({ checkFalsy: true })
            .isIn(['customer', 'worker', 'supplier', 'admin'])
            .withMessage('Invalid role')
    ],
    profile: [
        body('firstName')
            .optional()
            .trim()
            .isLength({ min: 2 })
            .withMessage('First name must be at least 2 characters'),
        body('phone')
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^\d{10}$/)
            .withMessage('Phone must be exactly 10 digits'),
        body('hourlyRate')
            .optional({ checkFalsy: true })
            .isNumeric()
            .withMessage('Hourly rate must be a number'),
    ],
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    job: [
        body('jobTitle').notEmpty().withMessage('Job title is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('jobDescription').notEmpty().withMessage('Description is required'),
        body('budgetMin').optional().isNumeric().withMessage('Min budget must be a number'),
        body('budgetMax').optional().isNumeric().withMessage('Max budget must be a number')
            .custom((value, { req }) => {
                if (value && req.body.budgetMin && Number(value) <= Number(req.body.budgetMin)) {
                    throw new Error('Maximum budget must be greater than minimum budget');
                }
                return true;
            }),
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
