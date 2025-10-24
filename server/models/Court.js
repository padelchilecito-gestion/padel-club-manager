const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la cancha es obligatorio.'],
    trim: true,
    unique: true, // Añadir unicidad para evitar nombres duplicados
  },
  courtType: { // Nombre corregido
    type: String,
    required: [true, 'El tipo de cancha es obligatorio.'],
    // --- CORRECCIÓN DEFINITIVA AQUÍ ---
    // Asegúrate que estos valores sean EXACTAMENTE 'classic' y 'panoramic'
    enum: {
      values: ['classic', 'panoramic'], 
      message: '{VALUE} no es un tipo de cancha válido (solo: classic, panoramic).',
    },
    // --- FIN DE CORRECCIÓN ---
    trim: true, // Quitar espacios extra
  },
  pricePerHour: { // Nombre corregido
    type: Number,
    required: [true, 'El precio por hora es obligatorio.'],
    min: [0, 'El precio no puede ser negativo.'],
  },
  status: {
    type: String,
    required: true,
    enum: { // Ser explícito con los valores permitidos para status también
        values: ['available', 'maintenance'],
        message: '{VALUE} no es un estado válido (solo: available, maintenance).'
    },
    default: 'available',
  },
  isActive: { // Para borrado lógico futuro
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true, 
});

// Índice para búsquedas por estado
courtSchema.index({ status: 1 });
// Índice único para el nombre
courtSchema.index({ name: 1 }, { unique: true });


const Court = mongoose.model('Court', courtSchema);

module.exports = Court;
