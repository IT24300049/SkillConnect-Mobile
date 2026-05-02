const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authValidation, validate } = require('../middleware/validation');
const router = express.Router();

// ROUTE: Register a new user
// POST /api/auth/register
router.post('/register', authValidation.register, validate, async (req, res) => {
    const logger = require('../middleware/logger');
    
    try {
        // 1. Get user details from the request body
        const { firstName, lastName, email, password, phone, role, district, city, skills, hourlyRate, experience, companyName } = req.body;

        // 2. Check if the email is already used
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Email already registered' 
            });
        }

        // 3. Create a new User object
        const user = new User({
            firstName,
            lastName,
            email,
            passwordHash: password, // This will be hashed automatically in models/User.js
            phone,
            role: role || 'customer',
            district,
            city,
            skills,
            hourlyRate,
            experience,
            companyName
        });

        // 4. Save to MongoDB
        await user.save();

        // 5. Generate a JWT Token so the user is logged in immediately
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        logger.info(`User registered: ${email}`);

        // 6. Send back success response
        res.status(201).json({
            status: 'success',
            data: {
                token,
                userId: user._id,
                name: `${user.firstName} ${user.lastName || ''}`.trim(),
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        res.status(500).json({ 
            status: 'error',
            message: 'Registration failed: ' + error.message
        });
    }
});

// ROUTE: Login an existing user
// POST /api/auth/login
router.post('/login', authValidation.login, validate, async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Invalid email or password' 
            });
        }

        // 2. Compare typed password with the one in DB
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Invalid email or password' 
            });
        }

        // 3. Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ 
                status: 'error',
                message: 'Account is deactivated' 
            });
        }

        // 4. Generate a JWT Token (This is the "VIP Pass")
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Send token and user info back to the mobile app
        res.json({
            status: 'success',
            data: {
                token,
                userId: user._id,
                name: `${user.firstName} ${user.lastName || ''}`.trim(),
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Login failed' 
        });
    }
});

// ROUTE: Get current logged-in user details
// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    // This uses the 'auth' middleware to verify the token first
    res.json({ status: 'success', data: req.user });
});

module.exports = router;
