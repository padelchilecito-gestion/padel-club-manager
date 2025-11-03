// server/models/Booking.js (CORREGIDO)
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  
  // --- INICIO DE LA CORRECCIÓN ---
  // 1. Campo 'user' para usuarios registrados (opcional)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Es opcional, puede ser un invitado
  },
  // 2. Campos para 'invitados' (que también aplican si el usuario está registrado)
  clientName: {
    type: String,
    required: true,
  },
  clientLastName: {
    type: String,
    required: false,
  },
  clientPhone: {
    type: String,
    required: true,
  },
  // --- FIN DE LA CORRECCIÓN ---

  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    // 3. Añadido 'AwaitingPayment' que usa el controlador
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'NoShow', 'AwaitingPayment'],
    default: 'Pending',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    // 4. Ajustados enums para coincidir con el controlador ('Cash', 'MercadoPago')
    enum: ['Efectivo', 'MercadoPago', 'Transferencia', 'QR', 'Otro', 'Cash'],
    default: 'Efectivo',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index to prevent double booking on the same court at the same time
BookingSchema.index({ court: 1, startTime: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'Cancelled' } } });

// Índice TTL para eliminar reservas antiguas automáticamente
BookingSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 864000, // 10 días
    partialFilterExpression: {
      status: { $in: ['Completed', 'Cancelled'] }
    }
  }
);

module.exports = mongoose.model('Booking', BookingSchema);
