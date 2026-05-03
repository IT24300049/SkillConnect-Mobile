const { body, validationResult } = require('express-validator');

// Validation schemas
const authValidation = {
    // ─── Registration Validation ───
    // Applied when any new user (Customer, Worker, or Supplier) signs up.
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
            .withMessage('Invalid role'),
        // Workers must provide at least one skill during registration
        body('skills')
            .if(body('role').equals('worker'))
            .notEmpty()
            .withMessage('At least one skill is required for workers')
            .isArray({ min: 1 })
            .withMessage('Skills must be an array with at least one item'),
    ],

    // ─── Profile Update Validation ───
    // Applied when a user updates their profile in the dashboard.
    // - Customers: Usually update Name, Phone, and Location.
    // - Workers: Additionally update Bio, Skills, Hourly Rate, and Experience.
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
        // 'hourlyRate' is primarily for Workers; optional({ checkFalsy: true }) 
        // ensures that Customers (who send an empty string) don't trigger an error.
        body('hourlyRate')
            .optional({ checkFalsy: true })
            .isNumeric()
            .withMessage('Hourly rate must be a number'),
    ],

    // ─── Login Validation ───
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],

    // ─── Job Posting Validation ───
    // Applied when a Customer creates or edits a Job request.
    job: [
        body('jobTitle').notEmpty().withMessage('Job title is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('jobDescription').notEmpty().withMessage('Description is required'),
        body('budgetMin').optional().isNumeric().withMessage('Min budget must be a number'),
        body('budgetMax').optional().isNumeric().withMessage('Max budget must be a number')
            .custom((value, { req }) => {
                // Business logic: Max budget must always be higher than min budget
                if (value && req.body.budgetMin && Number(value) <= Number(req.body.budgetMin)) {
                    throw new Error('Maximum budget must be greater than minimum budget');
                }
                return true;
            }),
    ]
};

// Validation middleware: Final check before hitting the controller
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

// ─── Sanitization Helpers ───
// These functions strip out any fields not explicitly allowed.
// This prevents "Mass Assignment" attacks where a user might try to 
// elevate their own role (e.g., trying to change role to 'admin' via profile update).

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
    // Fields like 'role', 'isVerified', and 'skills' are EXCLUDED here so users cannot change them.
    // Skills are set at registration and are permanent.
    const allowed = ['firstName', 'lastName', 'phone', 'district', 'city', 'bio', 'hourlyRate', 'experience', 'companyName'];
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
