const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: false
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewerType: {
        type: String,
        enum: ['customer', 'worker'],
        required: true
    },
    overallRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: String,
    isVerified: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
