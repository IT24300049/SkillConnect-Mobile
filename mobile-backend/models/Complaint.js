const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complainant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    complainedAgainst: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    complaintCategory: {
        type: String,
        enum: ['service_quality', 'inappropriate_behavior', 'fraud', 'payment_issue', 'other'],
        required: true
    },
    complaintTitle: {
        type: String,
        required: true,
        trim: true
    },
    complaintDescription: {
        type: String,
        required: true
    },
    complaintStatus: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'rejected'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    resolutionNotes: String,
    resolvedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
