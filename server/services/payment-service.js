const mongoose = require('mongoose');
const PendingPayment = require('../models/PendingPayment');
const PendingSale = require('../models/PendingSale');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

/**
 * Processes a pending Point of Sale (POS) sale after successful payment.
 * Creates a final Sale document, updates product stock, and deletes the pending sale.
 * @param {string} externalReference - The ID of the PendingSale document.
 * @param {object} io - The Socket.IO instance for real-time updates.
 * @returns {object|null} The created Sale document or null if not found.
 */
async function processPosSale(externalReference, io) {
    const pendingSale = await PendingSale.findById(externalReference);
    if (!pendingSale) {
        return null;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create the final sale from the pending data
        const newSale = new Sale({
            items: pendingSale.items,
            total: pendingSale.total,
            paymentMethod: 'Mercado Pago',
        });

        // Update stock for each item in the sale
        for (const item of pendingSale.items) {
            // Assumes `item._id` holds the Product's ID. Adjust if the schema differs.
            const product = await Product.findById(item._id).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Not enough stock for product ${item.name} (ID: ${item._id})`);
            }
            product.stock -= item.quantity;
            await product.save({ session });
        }

        await newSale.save({ session });
        await PendingSale.findByIdAndDelete(externalReference, { session });

        await session.commitTransaction();
        console.log(`Sale ${newSale._id} created successfully from PendingSale ${externalReference}.`);

        io.emit('new_sale', newSale);

        return newSale;

    } catch (error) {
        await session.abortTransaction();
        console.error(`Error processing POS sale for reference ${externalReference}:`, error);
        return null;
    } finally {
        session.endSession();
    }
}

/**
 * Processes a pending booking payment after successful payment.
 * Creates a final Booking document, marks it as paid, and deletes the pending payment.
 * @param {string} externalReference - The ID of the PendingPayment document.
 * @param {object} io - The Socket.IO instance for real-time updates.
 * @returns {object|null} The created Booking document or null if not found.
 */
async function processBookingPayment(externalReference, io) {
    const pendingPayment = await PendingPayment.findById(externalReference);
    if (!pendingPayment) {
        return null;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create the final booking
        const newBooking = new Booking({
            court: pendingPayment.court,
            slots: pendingPayment.slots,
            user: pendingPayment.user,
            date: pendingPayment.date,
            total: pendingPayment.total,
            isPaid: true,
            status: 'Confirmed',
            paymentMethod: 'Mercado Pago',
        });

        await newBooking.save({ session });
        await PendingPayment.findByIdAndDelete(externalReference, { session });

        await session.commitTransaction();
        console.log(`Booking ${newBooking._id} created successfully from PendingPayment ${externalReference}.`);

        await newBooking.populate(['user', 'court']);

        io.emit('booking_update', newBooking);

        return newBooking;

    } catch (error) {
        await session.abortTransaction();
        console.error(`Error processing booking payment for reference ${externalReference}:`, error);
        return null;
    } finally {
        session.endSession();
    }
}

module.exports = {
    processPosSale,
    processBookingPayment,
};