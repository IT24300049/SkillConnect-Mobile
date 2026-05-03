const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const { authValidation, validate, sanitizeJobData } = require('../middleware/validation');
const router = express.Router();

// GET /api/jobs — list all active jobs with pagination
router.get('/', auth, async (req, res) => {
    try {
        const { category, district, status, page = 1, limit = 20 } = req.query;
        
        // Validate pagination params
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        if (category && typeof category === 'string') filter.category = category;
        if (district && typeof district === 'string') filter.district = district;
        if (status && typeof status === 'string') filter.jobStatus = status;
        else filter.jobStatus = 'active';

        const jobs = await Job.find(filter)
            .populate('customer', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Job.countDocuments(filter);

        res.json({ 
            status: 'success', 
            data: { 
                content: jobs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch jobs' });
    }
});

// GET /api/jobs/my — get my posted jobs
router.get('/my', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const jobs = await Job.find({ customer: req.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        
        const total = await Job.countDocuments({ customer: req.userId });

        res.json({ 
            status: 'success', 
            data: { 
                content: jobs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch your jobs' });
    }
});

// GET /api/jobs/applications/my — get jobs I have applied to
router.get('/applications/my', auth, async (req, res) => {
    try {
        if (req.user.role !== 'worker') {
            return res.status(403).json({ status: 'error', message: 'Only workers can view their applications' });
        }
        
        const jobs = await Job.find({ 'applications.worker': req.userId })
            .populate('customer', 'firstName lastName')
            .sort({ createdAt: -1 });

        const myApplications = [];
        jobs.forEach(job => {
            const app = job.applications.find(a => a.worker.toString() === req.userId.toString());
            if (app) {
                myApplications.push({
                    _id: app._id,
                    jobId: job._id,
                    job: {
                        _id: job._id,
                        jobTitle: job.jobTitle,
                        category: job.category,
                        district: job.district,
                    },
                    customer: job.customer,
                    coverLetter: app.coverLetter,
                    proposedRate: app.proposedRate,
                    status: app.status,
                    createdAt: app.appliedAt
                });
            }
        });

        res.json({ status: 'success', data: myApplications });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch applications' });
    }
});

// GET /api/jobs/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('customer', 'firstName lastName email phone')
            .populate('applications.worker', 'firstName lastName email skills');
        if (!job) return res.status(404).json({ status: 'error', message: 'Job not found' });

        job.viewsCount += 1;
        await job.save();

        res.json({ status: 'success', data: job });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch job' });
    }
});

// POST /api/jobs — create a new job
router.post('/', auth, authValidation.job, validate, async (req, res) => {
    try {
        const sanitized = sanitizeJobData(req.body);
        const job = new Job({ ...sanitized, customer: req.userId });
        await job.save();
        res.status(201).json({ status: 'success', data: job });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to create job' });
    }
});

// PUT /api/jobs/:id — update job (only by customer)
router.put('/:id', auth, authValidation.job, validate, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, customer: req.userId });
        if (!job) return res.status(404).json({ status: 'error', message: 'Job not found or not authorized' });

        // Only allow updating specific fields
        const sanitized = sanitizeJobData(req.body);
        Object.assign(job, sanitized);
        await job.save();

        res.json({ status: 'success', data: job });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to update job' });
    }
});

// DELETE /api/jobs/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findOneAndDelete({ _id: req.params.id, customer: req.userId });
        if (!job) return res.status(404).json({ status: 'error', message: 'Job not found or not authorized' });
        res.json({ status: 'success', message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete job' });
    }
});

// POST /api/jobs/:id/apply — apply for a job
router.post('/:id/apply', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ status: 'error', message: 'Job not found' });

        const alreadyApplied = job.applications.find(
            a => a.worker.toString() === req.userId.toString()
        );
        if (alreadyApplied) return res.status(400).json({ status: 'error', message: 'Already applied' });

        job.applications.push({
            worker: req.userId,
            coverLetter: req.body.coverLetter,
            proposedRate: req.body.proposedRate
        });
        await job.save();

        res.status(201).json({ status: 'success', message: 'Application submitted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to submit application' });
    }
});

// PUT /api/jobs/:id/applications/:appId — accept or reject an application
router.put('/:id/applications/:appId', auth, async (req, res) => {
    try {
        const { status, reason } = req.body;
        
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }
        
        if (status === 'rejected' && (!reason || reason.trim() === '')) {
            return res.status(400).json({ status: 'error', message: 'A reason is required when rejecting an application' });
        }

        const job = await Job.findOne({ _id: req.params.id, customer: req.userId });
        if (!job) {
            return res.status(404).json({ status: 'error', message: 'Job not found or unauthorized' });
        }

        const application = job.applications.id(req.params.appId);
        if (!application) {
            return res.status(404).json({ status: 'error', message: 'Application not found' });
        }

        application.status = status;
        if (status === 'rejected') {
            application.reason = reason;
        } else if (status === 'accepted') {
            // Store assigned worker and auto-close job
            job.assignedWorker = application.worker;
            job.jobStatus = 'assigned';
            job.applications.forEach(app => {
                if (app._id.toString() !== req.params.appId && app.status === 'pending') {
                    app.status = 'rejected';
                    app.reason = 'Another applicant was selected for this job.';
                }
            });
        }

        await job.save();
        res.json({ status: 'success', data: application });
    } catch (error) {
        console.error("Application update error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to update application status' });
    }
});

// PATCH /api/jobs/:id/status — update job status (e.g., mark as completed)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status update' });
        }

        const job = await Job.findOne({ _id: req.params.id, customer: req.userId });
        if (!job) {
            return res.status(404).json({ status: 'error', message: 'Job not found or unauthorized' });
        }

        job.jobStatus = status;
        if (status === 'completed') {
            job.completedAt = new Date();
        }

        await job.save();
        res.json({ status: 'success', data: job });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update job status' });
    }
});

module.exports = router;
