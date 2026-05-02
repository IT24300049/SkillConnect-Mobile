const express = require('express');
const Equipment = require('../models/Equipment');
const Rental = require('../models/Rental');
const auth = require('../middleware/auth');
const router = express.Router();

const sanitizeEquipmentData = (data) => {
    const allowed = [
        'equipmentName', 
        'equipmentDescription', 
        'category', 
        'equipmentCondition', 
        'rentalPricePerDay', 
        'depositAmount', 
        'quantityAvailable', 
        'quantityTotal', 
        'isAvailable',
        'location'
    ];
    const sanitized = {};
    allowed.forEach(field => {
        if (data[field] !== undefined) sanitized[field] = data[field];
    });
    return sanitized;
};

// GET /api/equipment — list available equipment with pagination
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = { isAvailable: true };
        if (category && typeof category === 'string') filter.category = category;

        const equipment = await Equipment.find(filter)
            .populate('supplier', 'firstName lastName companyName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Equipment.countDocuments(filter);

        res.json({ 
            status: 'success', 
            data: { 
                content: equipment,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch equipment' });
    }
});

// GET /api/equipment/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const item = await Equipment.findById(req.params.id)
            .populate('supplier', 'firstName lastName companyName email phone');
        if (!item) return res.status(404).json({ status: 'error', message: 'Equipment not found' });
        res.json({ status: 'success', data: item });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch equipment' });
    }
});

// POST /api/equipment — add equipment (supplier only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'supplier') {
            return res.status(403).json({ status: 'error', message: 'Only suppliers can add equipment' });
        }

        const sanitized = sanitizeEquipmentData(req.body);
        const equipment = new Equipment({
            ...sanitized,
            supplier: req.userId
        });
        await equipment.save();
        res.status(201).json({ status: 'success', data: equipment });
    } catch (error) {
        console.error('Equipment Creation Error:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to add equipment' });
    }
});

// PUT /api/equipment/:id — update equipment (supplier only)
router.put('/:id', auth, async (req, res) => {
    try {
        const equipment = await Equipment.findOne({
            _id: req.params.id,
            supplier: req.userId
        });
        if (!equipment) return res.status(404).json({ status: 'error', message: 'Equipment not found or not authorized' });

        const sanitized = sanitizeEquipmentData(req.body);
        Object.assign(equipment, sanitized);
        await equipment.save();

        res.json({ status: 'success', data: equipment });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Failed to update equipment' });
    }
});

// DELETE /api/equipment/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const equipment = await Equipment.findOneAndDelete({
            _id: req.params.id,
            supplier: req.userId
        });
        if (!equipment) return res.status(404).json({ status: 'error', message: 'Equipment not found or not authorized' });
        res.json({ status: 'success', message: 'Equipment deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete equipment' });
    }
});

// POST /api/equipment/:id/rent — rent equipment (customer only)
router.post('/:id/rent', auth, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ status: 'error', message: 'Only customers can rent equipment' });
        }

        const { startDate, endDate, quantity } = req.body;

        if (!startDate || !endDate || !quantity) {
            return res.status(400).json({ status: 'error', message: 'startDate, endDate, and quantity are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({ status: 'error', message: 'Start date cannot be in the past' });
        }
        if (end <= start) {
            return res.status(400).json({ status: 'error', message: 'End date must be after start date' });
        }

        const qty = parseInt(quantity) || 1;
        const equipment = await Equipment.findById(req.params.id)
            .populate('supplier', 'firstName lastName');

        if (!equipment) {
            return res.status(404).json({ status: 'error', message: 'Equipment not found' });
        }
        if (!equipment.isAvailable) {
            return res.status(400).json({ status: 'error', message: 'Equipment is not available for rental' });
        }
        if (equipment.quantityAvailable < qty) {
            return res.status(400).json({
                status: 'error',
                message: `Only ${equipment.quantityAvailable} unit(s) available`
            });
        }

        const diffMs = end - start;
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const totalCost = days * equipment.rentalPricePerDay * qty;

        // Reduce available quantity
        equipment.quantityAvailable -= qty;
        if (equipment.quantityAvailable === 0) {
            equipment.isAvailable = false;
        }
        await equipment.save();

        // Create rental record
        const rental = new Rental({
            customer: req.userId,
            equipment: equipment._id,
            supplier: equipment.supplier._id || equipment.supplier,
            startDate: start,
            endDate: end,
            quantity: qty,
            days,
            pricePerDay: equipment.rentalPricePerDay,
            totalCost
        });
        await rental.save();

        res.json({
            status: 'success',
            data: {
                rentalId: rental._id,
                equipmentId: equipment._id,
                equipmentName: equipment.equipmentName,
                supplier: equipment.supplier,
                startDate: start,
                endDate: end,
                quantity: qty,
                days,
                pricePerDay: equipment.rentalPricePerDay,
                totalCost,
                currency: 'LKR',
                remainingStock: equipment.quantityAvailable,
            }
        });
    } catch (error) {
        console.error('Equipment Rental Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to process rental' });
    }
});

module.exports = router;

