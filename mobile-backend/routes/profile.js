const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sanitizeProfileData, authValidation, validate } = require('../middleware/validation');
const router = express.Router();

// ROUTE: Get my own profile
// GET /api/profile/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        // Calculate stats for the dashboard
        let stats = {};
        const Review = require('../models/Review');
        const Booking = require('../models/Booking');

        const reviews = await Review.find({ reviewee: req.userId });
        const avg = reviews.length > 0 
            ? reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length 
            : 0;
        
        // Count bookings where user is either worker or customer
        const totalBookings = await Booking.countDocuments({ 
            $or: [{ worker: req.userId }, { customer: req.userId }] 
        });

        // Count completed jobs (for workers)
        const completedJobs = await Booking.countDocuments({ 
            worker: req.userId, 
            bookingStatus: 'completed' 
        });

        stats = {
            averageRating: avg,
            reviewCount: reviews.length,
            jobsCompleted: completedJobs || reviews.length, // Fallback to reviews if bookings not used yet
            totalBookings: totalBookings
        };

        res.json({ 
            status: 'success', 
            data: {
                ...user.toObject(),
                ...stats
            }
        });
    } catch (error) {
        console.error("Profile Dashboard Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
    }
});

// ROUTE: Update my own profile
// PUT /api/profile/me
router.put('/me', auth, authValidation.profile, validate, async (req, res) => {
    try {
        const sanitized = sanitizeProfileData(req.body);
        const user = await User.findByIdAndUpdate(req.userId, sanitized, { new: true });
        res.json({ status: 'success', data: user });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to update profile' });
    }
});

// ROUTE: List all Workers (for Customers to browse)
// GET /api/profile/workers
router.get('/workers', auth, async (req, res) => {
    try {
        const { district, page = 1, limit = 20 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = { role: 'worker', isActive: true };
        if (district && typeof district === 'string') filter.district = district;
        if (req.query.category && typeof req.query.category === 'string') {
            filter.skills = req.query.category;
        }

        // Add isDeleted: false as aggregation bypasses query middleware
        filter.isDeleted = false;

        const workers = await User.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'bookings',
                    let: { workerId: '$_id' },
                    pipeline: [
                        { $match: { 
                            $expr: { $eq: ['$worker', '$$workerId'] },
                            bookingStatus: 'completed',
                            isDeleted: false
                        } },
                        { $count: 'count' }
                    ],
                    as: 'bookingCount'
                }
            },
            {
                $lookup: {
                    from: 'jobs',
                    let: { workerId: '$_id' },
                    pipeline: [
                        { $match: { 
                            $expr: { $eq: ['$assignedWorker', '$$workerId'] },
                            jobStatus: 'completed',
                            isDeleted: false
                        } },
                        { $count: 'count' }
                    ],
                    as: 'jobCount'
                }
            },
            {
                $addFields: {
                    jobsCompleted: {
                        $add: [
                            { $ifNull: [{ $arrayElemAt: ['$bookingCount.count', 0] }, 0] },
                            { $ifNull: [{ $arrayElemAt: ['$jobCount.count', 0] }, 0] }
                        ]
                    }
                }
            },
            { $project: { passwordHash: 0, bookingCount: 0, jobCount: 0 } },
            { $sort: { createdAt: -1 } }, // Default sort
            { $skip: skip },
            { $limit: limitNum }
        ]);

        const total = await User.countDocuments(filter);

        res.json({ 
            status: 'success', 
            data: { 
                content: workers,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch workers' });
    }
});

// ROUTE: List all Customers (for Workers/Admins to file complaints)
// GET /api/profile/customers
router.get('/customers', auth, async (req, res) => {
    try {
        // SECURITY: Only Workers and Admins should see the full list of customers
        if (req.user.role !== 'admin' && req.user.role !== 'worker') {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        const { page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = { role: 'customer', isActive: true };
        const customers = await User.find(filter)
            .select('-passwordHash')
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(filter);

        res.json({ 
            status: 'success', 
            data: { 
                content: customers,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch customers' });
    }
});

// ROUTE: Get a specific worker's profile by their ID
// GET /api/profile/workers/:id
router.get('/workers/:id', auth, async (req, res) => {
    try {
        const worker = await User.findById(req.params.id).select('-passwordHash');
        if (!worker) return res.status(404).json({ status: 'error', message: 'Worker not found' });

        // Fetch reviews and calculate stats
        const Review = require('../models/Review');
        const Booking = require('../models/Booking');

        const reviews = await Review.find({ reviewee: req.params.id })
            .populate('reviewer', 'firstName lastName name')
            .sort({ createdAt: -1 });

        const avg = reviews.length > 0 
            ? reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length 
            : 0;

        const completedJobs = await Booking.countDocuments({ 
            worker: req.params.id, 
            bookingStatus: 'completed' 
        });

        res.json({ 
            status: 'success', 
            data: {
                ...worker.toObject(),
                reviews: reviews,
                averageRating: avg,
                jobsCompleted: completedJobs || reviews.length // Fallback
            } 
        });
    } catch (error) {
        console.error("Worker Profile Error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch worker profile' });
    }
});

module.exports = router;
