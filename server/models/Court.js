const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la cancha es obligatorio.'],
    trim: true,
  },
  courtType: { // Nombre corregido
    type: String,
    required: [true, 'El tipo de cancha es obligatorio.'],
    // --- CORRECCIÓN AQUÍ ---
    // Asegúrate que estos valores coincidan EXACTAMENTE (minúsculas)
    // con los 'value' del <select> en CourtFormModal.jsx
    enum: {
      values: ['classic', 'panoramic'], 
      message: '{VALUE} no es un tipo de cancha válido (usar: classic, panoramic).',
    },
    // --- FIN DE CORRECCIÓN ---
  },
  pricePerHour: { // Nombre corregido
    type: Number,
    required: [true, 'El precio por hora es obligatorio.'],
    min: [0, 'El precio no puede ser negativo.'],
  },
  // Ya NO usamos availableSlots aquí, se calculan dinámicamente
  // availableSlots: [{ 
  //   type: String, // formato HH:mm
  //   match: [/^\d{2}:\d{2}$/, 'El formato del horario debe ser HH:MM'],
  // }],
  status: {
    type: String,
    required: true,
    enum: ['available', 'maintenance'],
    default: 'available',
  },
  isActive: { // Campo para borrado lógico si se implementara
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índice para búsquedas eficientes por estado (útil para getPublicCourts)
courtSchema.index({ status: 1 });

const Court = mongoose.model('Court', courtSchema);

module.exports = Court;
