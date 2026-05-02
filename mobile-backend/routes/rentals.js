const express = require('express');
const Rental = require('../models/Rental');
const Equipment = require('../models/Equipment');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/v1/rentals/my — customer: get my rentals
router.get('/my', auth, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ status: 'error', message: 'Only customers can view their rentals' });
        }
        const rentals = await Rental.find({ customer: req.userId })
            .populate('equipment', 'equipmentName category equipmentCondition rentalPricePerDay location')
            .populate('supplier', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: rentals });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch rentals' });
    }
});

// GET /api/v1/rentals/supplier — supplier: get rentals for their equipment
router.get('/supplier', auth, async (req, res) => {
    try {
        if (req.user.role !== 'supplier') {
            return res.status(403).json({ status: 'error', message: 'Only suppliers can view equipment rentals' });
        }
        const rentals = await Rental.find({ supplier: req.userId })
            .populate('equipment', 'equipmentName category equipmentCondition rentalPricePerDay location')
            .populate('customer', 'firstName lastName email phone')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: rentals });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch rentals' });
    }
});

// PUT /api/v1/rentals/:id/return — customer: return equipment
router.put('/:id/return', auth, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ status: 'error', message: 'Only customers can return equipment' });
        }

        const rental = await Rental.findOne({ _id: req.params.id, customer: req.userId });
        if (!rental) {
            return res.status(404).json({ status: 'error', message: 'Rental not found or not authorized' });
        }
        if (rental.status === 'returned') {
            return res.status(400).json({ status: 'error', message: 'Equipment already returned' });
        }

        // Restore equipment quantity
        const equipment = await Equipment.findById(rental.equipment);
        if (equipment) {
            equipment.quantityAvailable = Math.min(
                equipment.quantityTotal,
                equipment.quantityAvailable + rental.quantity
            );
            if (equipment.quantityAvailable > 0) {
                equipment.isAvailable = true;
            }
            await equipment.save();
        }

        rental.status = 'returned';
        rental.returnedAt = new Date();
        await rental.save();

        res.json({ status: 'success', data: rental, message: 'Equipment returned successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to process return' });
    }
});

module.exports = router;
