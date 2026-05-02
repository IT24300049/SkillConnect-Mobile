const express = require('express');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/reviews — all reviews with pagination
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const reviews = await Review.find()
            .populate('reviewer', 'firstName lastName')
            .populate('reviewee', 'firstName lastName')
            .populate('booking', 'scheduledDate')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Review.countDocuments();

        res.json({ 
            status: 'success', 
            data: { 
                content: reviews,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/my — my reviews
router.get('/my', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const reviews = await Review.find({ reviewer: req.userId })
            .populate('reviewee', 'firstName lastName')
            .populate('booking', 'scheduledDate')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Review.countDocuments({ reviewer: req.userId });

        res.json({ 
            status: 'success', 
            data: { 
                content: reviews,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch your reviews' });
    }
});

// POST /api/reviews — submit review
router.post('/', auth, async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.reviewee || !req.body.booking || !req.body.rating) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'reviewee, booking, and rating are required' 
            });
        }

        // Validate rating range
        if (req.body.rating < 1 || req.body.rating > 5) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Rating must be between 1 and 5' 
            });
        }

        const review = new Review({ 
            ...req.body, 
            reviewer: req.userId 
        });
        await review.save();
        res.status(201).json({ status: 'success', data: review });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to submit review' });
    }
});

// PUT /api/reviews/:id — update review (only reviewer)
router.put('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            reviewer: req.userId
        });
        if (!review) return res.status(404).json({ status: 'error', message: 'Review not found or not authorized' });

        // Only allow updating certain fields
        if (req.body.rating) {
            if (req.body.rating < 1 || req.body.rating > 5) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Rating must be between 1 and 5' 
                });
            }
            review.rating = req.body.rating;
        }
        if (req.body.comment) review.comment = req.body.comment;

        await review.save();
        res.json({ status: 'success', data: review });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to update review' });
    }
});

// DELETE /api/reviews/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({ 
            _id: req.params.id, 
            reviewer: req.userId 
        });
        if (!review) return res.status(404).json({ status: 'error', message: 'Review not found or not authorized' });
        res.json({ status: 'success', message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete review' });
    }
});

module.exports = router;
