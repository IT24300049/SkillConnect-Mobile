const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    jobTitle: {
        type: String,
        required: true,
        trim: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    locationAddress: String,
    city: String,
    district: {
        type: String,
        index: true
    },
    urgencyLevel: {
        type: String,
        enum: ['emergency', 'urgent', 'standard', 'scheduled'],
        default: 'standard'
    },
    budgetMin: Number,
    budgetMax: Number,
    estimatedDurationHours: Number,
    preferredStartDate: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Preferred start date must be in the future'
        }
    },
    jobStatus: {
        type: String,
        enum: ['draft', 'active', 'assigned', 'completed', 'cancelled', 'expired'],
        default: 'active',
        index: true
    },
    expiryDate: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value > new Date();
            },
            message: 'Expiry date must be in the future'
        }
    },
    assignedWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    completedAt: Date,
    viewsCount: {
        type: Number,
        default: 0
    },
    applications: [{
        worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        coverLetter: String,
        proposedRate: Number,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        reason: String,
        appliedAt: { type: Date, default: Date.now }
    }],
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Automatically filter out soft-deleted records
jobSchema.pre('find', function() {
    this.where({ isDeleted: false });
});

jobSchema.pre('findOne', function() {
    this.where({ isDeleted: false });
});

jobSchema.pre('findOneAndUpdate', function() {
    this.where({ isDeleted: false });
});

// Add soft delete method
jobSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return await this.save();
};

// Add restore method
jobSchema.methods.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return await this.save();
};

module.exports = mongoose.model('Job', jobSchema);
