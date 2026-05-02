const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    days: {
        type: Number,
        required: true
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    totalCost: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'returned', 'cancelled'],
        default: 'active'
    },
    returnedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Rental', rentalSchema);
