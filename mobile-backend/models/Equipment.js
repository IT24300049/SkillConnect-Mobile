const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    equipmentName: {
        type: String,
        required: true,
        trim: true
    },
    equipmentDescription: String,
    category: {
        type: String,
        required: true
    },
    equipmentCondition: {
        type: String,
        enum: ['new', 'excellent', 'good', 'fair'],
        required: true
    },
    rentalPricePerDay: {
        type: Number,
        required: true
    },
    depositAmount: {
        type: Number,
        default: 0
    },
    quantityAvailable: {
        type: Number,
        default: 1
    },
    quantityTotal: {
        type: Number,
        default: 1
    },
    location: {
        type: String,
        default: ''
    },
    imagePath: String,
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Equipment', equipmentSchema);

