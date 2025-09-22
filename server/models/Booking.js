const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true
    },
    user: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled'],
        default: 'Pending'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        enum: ['Efectivo', 'MercadoPago', 'Pendiente', 'Otro'],
        default: 'Pendiente'
    },
    paymentId: { type: String },
    paymentStatus: { type: String },
    reminderSent: {
        type: Boolean,
        default: false
    },
    // ⭐ NUEVO CAMPO: Fecha de expiración para el TTL
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

bookingSchema.index({ court: 1, startTime: 1 }, { unique: true });

// ⭐ AÑADIDO: Índice TTL en el nuevo campo 'expiresAt'
// expireAfterSeconds: 0 indica que MongoDB eliminará el documento
// tan pronto como la fecha en 'expiresAt' sea alcanzada.
bookingSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;