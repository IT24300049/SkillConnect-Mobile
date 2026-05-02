const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This is the "Security Guard" middleware.
// It checks if the request has a valid VIP Pass (JWT Token).
const auth = async (req, res, next) => {
    try {
        // 1. Get the token from the request header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // 2. Remove the "Bearer " word to get just the token string
        const token = authHeader.replace('Bearer ', '');

        // 3. Verify the token using our Secret Key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Find the user in the database using the ID from the token
        const user = await User.findById(decoded.userId);

        // 5. Check if the user exists and is active
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid token or inactive account.' });
        }

        // 6. Save the user info in the request object so the next function can use it
        req.user = user;
        req.userId = user._id;

        // 7. Go to the next function (the actual route logic)
        next();
    } catch (error) {
        // If verification fails (e.g., token expired or tampered with)
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Admin Only Guard
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
};

module.exports = auth;
module.exports.adminOnly = adminOnly;
