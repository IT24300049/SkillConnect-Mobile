const express = require('express');
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/complaints — all complaints (admin) or my complaints
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = req.user.role === 'admin' ? {} : { complainant: req.userId };
        
        const complaints = await Complaint.find(filter)
            .populate('complainant', 'firstName lastName')
            .populate('complainedAgainst', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Complaint.countDocuments(filter);

        res.json({ 
            status: 'success', 
            data: { 
                content: complaints,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch complaints' });
    }
});

// GET /api/complaints/my
router.get('/my', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const complaints = await Complaint.find({ complainant: req.userId })
            .populate('complainedAgainst', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Complaint.countDocuments({ complainant: req.userId });

        res.json({ 
            status: 'success', 
            data: { 
                content: complaints,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch your complaints' });
    }
});

// POST /api/complaints — submit complaint
router.post('/', auth, async (req, res) => {
    try {
        const { complainedAgainst, complaintCategory, complaintTitle, complaintDescription } = req.body;

        if (!complainedAgainst || !complaintCategory || !complaintTitle || !complaintDescription) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'complainedAgainst, category, title, and description are required' 
            });
        }

        const complaint = new Complaint({ 
            ...req.body, 
            complainant: req.userId 
        });
        await complaint.save();
        res.status(201).json({ status: 'success', data: complaint });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to submit complaint' });
    }
});

// PATCH /api/complaints/:id/status — update status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Only admins can update complaint status' });
        }

        const { status, resolutionNotes } = req.body;
        
        // Validate status
        if (!['open', 'under_review', 'resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }

        const update = { complaintStatus: status };
        if (status === 'resolved') {
            update.resolvedAt = new Date();
            update.resolutionNotes = resolutionNotes;
        }

        const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!complaint) return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        
        res.json({ status: 'success', data: complaint });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update complaint status' });
    }
});

// PUT /api/complaints/:id — update complaint details (complainant only, if pending)
router.put('/:id', auth, async (req, res) => {
    try {
        const { complaintCategory, complaintTitle, complaintDescription, priority } = req.body;

        const complaint = await Complaint.findOne({ 
            _id: req.params.id, 
            complainant: req.userId 
        });

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found or not authorized' });
        }

        // Only allow editing if status is pending
        if (complaint.complaintStatus !== 'pending') {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Complaints can only be edited while they are still pending' 
            });
        }

        // Update fields
        if (complaintCategory) complaint.complaintCategory = complaintCategory;
        if (complaintTitle) complaint.complaintTitle = complaintTitle;
        if (complaintDescription) complaint.complaintDescription = complaintDescription;
        if (priority) complaint.priority = priority;

        await complaint.save();
        res.json({ status: 'success', data: complaint });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update complaint details' });
    }
});

// DELETE /api/complaints/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findOneAndDelete({ 
            _id: req.params.id, 
            complainant: req.userId 
        });
        if (!complaint) return res.status(404).json({ status: 'error', message: 'Complaint not found or not authorized' });
        res.json({ status: 'success', message: 'Complaint deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete complaint' });
    }
});

module.exports = router;
