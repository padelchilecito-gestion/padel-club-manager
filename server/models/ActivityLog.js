const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    // Quién realizó la acción. Guardamos el ID y el nombre de usuario.
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String, required: true }
    },
    // Qué acción se realizó.
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'RESERVA_CREADA',
            'RESERVA_MODIFICADA',
            'RESERVA_ELIMINADA',
            'VENTA_REGISTRADA',
            'PRODUCTO_CREADO',
            'PRODUCTO_ACTUALIZADO',
            'PRODUCTO_ELIMINADO',
            'USUARIO_CREADO',
            'USUARIO_ELIMINADO',
            'CANCHA_CREADA',
            'CANCHA_ACTUALIZADA',
            'CANCHA_ESTADO_CAMBIADO'
        ]
    },
    // Un texto descriptivo del evento.
    details: {
        type: String,
        required: true
    },
    // Fecha y hora en que ocurrió.
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Indexamos por fecha para que las consultas sean más rápidas
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;