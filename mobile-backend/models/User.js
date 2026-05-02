const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This is the blueprint for how a User is saved in the Database (MongoDB)
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // No two users can have the same email
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash: {
        type: String,
        required: true // We store the scrambled version of the password here
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['customer', 'worker', 'supplier', 'admin'], // These are the only allowed roles
        default: 'customer',
        index: true
    },
    // Extra details for Workers and Suppliers
    district: String,
    city: String,
    skills: [String],
    bio: String,
    hourlyRate: Number,
    experience: String,
    companyName: String,
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    // Soft Delete: We don't remove users, we just mark them as deleted
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
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt'
});

// Automatically filter out soft-deleted records in find queries
// This ensures we don't accidentally show deleted users in the app
userSchema.pre('find', function() {
    this.where({ isDeleted: false });
});

userSchema.pre('findOne', function() {
    this.where({ isDeleted: false });
});

userSchema.pre('findOneAndUpdate', function() {
    this.where({ isDeleted: false });
});

userSchema.pre('findOneAndDelete', function() {
    this.where({ isDeleted: false });
});

// Helper method to "delete" a user without removing from DB
userSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return await this.save();
};

// Helper method to bring back a deleted user
userSchema.methods.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return await this.save();
};

// SECURITY: Scramble (Hash) the password before saving it to the database
userSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
});

// Helper method to check if the typed password matches the scrambled one in DB
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// SECURITY: Never send the password back to the frontend/mobile app
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
