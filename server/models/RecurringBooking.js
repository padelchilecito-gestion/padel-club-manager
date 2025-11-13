const mongoose = require('mongoose');

const RecurringBookingSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  user: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
  },
  // Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String, // Formato "HH:mm" (ej: "20:00")
    required: true,
  },
  duration: {
    type: Number, // Duración en minutos
    required: true,
    default: 60,
  },
  price: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Mercado Pago', 'Transferencia', 'QR', 'Otro'],
    default: 'Efectivo',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true, // Para activar/desactivar la recurrencia
  },
  startDate: {
    type: Date, // Desde cuándo aplica esta recurrencia
    required: true,
  },
  endDate: {
    type: Date, // Hasta cuándo (opcional, null = indefinido)
    default: null,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Índice para evitar duplicados (misma cancha + día + hora)
RecurringBookingSchema.index({ court: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('RecurringBooking', RecurringBookingSchema);
