const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminOnly = auth.adminOnly;
const router = express.Router();

// ROUTE: Get all users (Admin only)
// GET /api/admin/users
router.get('/users', auth, adminOnly, async (req, res) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = { isDeleted: false };
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(filter);

        res.json({
            status: 'success',
            data: {
                content: users,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error("Admin Fetch Users Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
    }
});

// ROUTE: Toggle User Status (Admin only)
// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', auth, adminOnly, async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Prevent disabling any admin account
        if (userToUpdate.role === 'admin') {
            return res.status(400).json({ status: 'error', message: 'Admin accounts cannot be disabled' });
        }

        userToUpdate.isActive = isActive;
        await userToUpdate.save();

        res.json({
            status: 'success',
            message: `User account ${userToUpdate.isActive ? 'enabled' : 'disabled'} successfully`,
            data: userToUpdate
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update user status' });
    }
});

module.exports = router;
