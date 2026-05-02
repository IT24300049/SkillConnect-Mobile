/**
 * Database Transaction Helper
 * Ensures data consistency for multi-step operations
 */

const startSession = async (mongoose) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
};

const commitTransaction = async (session) => {
    await session.commitTransaction();
    await session.endSession();
};

const abortTransaction = async (session) => {
    await session.abortTransaction();
    await session.endSession();
};

/**
 * Create booking with transaction
 * Ensures booking creation is atomic
 */
const createBookingWithTransaction = async (bookingData, mongoose) => {
    const session = await startSession(mongoose);
    
    try {
        const Booking = require('../models/Booking');
        const booking = new Booking(bookingData);
        await booking.save({ session });
        await commitTransaction(session);
        return booking;
    } catch (error) {
        await abortTransaction(session);
        throw error;
    }
};

/**
 * Update booking status with transaction
 */
const updateBookingStatusWithTransaction = async (bookingId, updates, mongoose) => {
    const session = await startSession(mongoose);
    
    try {
        const Booking = require('../models/Booking');
        const booking = await Booking.findByIdAndUpdate(bookingId, updates, { new: true, session });
        if (!booking) throw new Error('Booking not found');
        await commitTransaction(session);
        return booking;
    } catch (error) {
        await abortTransaction(session);
        throw error;
    }
};

module.exports = {
    startSession,
    commitTransaction,
    abortTransaction,
    createBookingWithTransaction,
    updateBookingStatusWithTransaction
};
