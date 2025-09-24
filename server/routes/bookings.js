const express = require('express');
const router = express.Router();
const BookingService = require('../services/booking-service');
const logActivity = require('../middleware/logActivity');

// Middleware de manejo de errores para las rutas de reservas
const handleBookingError = (err, res) => {
    console.error(`Error en la operación de reserva: ${err.message}`);
    // Error de validación o conflicto
    if (err.message.includes('obligatorio') || err.message.includes('inválido') || err.message.includes('conflicto')) {
        return res.status(400).json({ message: err.message });
    }
    // Conflicto de horario específico
    if (err.message.includes('ya no está disponible')) {
        return res.status(409).json({ message: err.message });
    }
    // Recurso no encontrado
    if (err.message.includes('no encontrada')) {
        return res.status(404).json({ message: err.message });
    }
    // Error genérico del servidor
    return res.status(500).json({ message: 'Ocurrió un error inesperado en el servidor.' });
};

// GET: Obtener todas las reservas para un rango de fechas
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ message: "Los parámetros 'start' y 'end' son obligatorios." });
        }
        const filters = {
            startTime: { $gte: new Date(start) },
            endTime: { $lte: new Date(end) }
        };
        const bookings = await BookingService.getBookings(filters);
        res.json(bookings);
    } catch (error) {
        handleBookingError(error, res);
    }
});

// POST: Crear una única reserva
router.post('/', logActivity('RESERVA_CREADA', (req) => `El cliente ${req.body.user.name} reservó en la cancha ID ${req.body.court}`), async (req, res) => {
    try {
        const newBooking = await BookingService.createBooking(req.body);
        req.io.emit('booking_update', { type: 'created', booking: newBooking });
        res.status(201).json(newBooking);
    } catch (error) {
        handleBookingError(error, res);
    }
});

// POST: Crear múltiples reservas en una sola transacción
router.post('/bulk', logActivity('RESERVA_MULTIPLE_CREADA', (req) => `El cliente ${req.body.user.name} realizó ${req.body.bookings.length} reservas.`), async (req, res) => {
    try {
        const { bookings, user } = req.body;
        const bookingsWithUser = bookings.map(b => ({ ...b, user, status: 'Confirmed' }));
        const createdBookings = await BookingService.createBulkBookings(bookingsWithUser);
        req.io.emit('booking_bulk_update', { type: 'created_bulk', bookings: createdBookings });
        res.status(201).json(createdBookings);
    } catch (error) {
        handleBookingError(error, res);
    }
});

// POST: Crear una nueva reserva para pago en efectivo
router.post('/cash', logActivity('RESERVA_PENDIENTE_CREADA', (req) => `El cliente ${req.body.user.name} reservó para pagar en efectivo`), async (req, res) => {
    try {
        const newBookings = await BookingService.createCashBooking(req.body);
        req.io.emit('booking_bulk_update', { type: 'created_cash', bookings: newBookings });
        res.status(201).json(newBookings);
    } catch (error) {
        handleBookingError(error, res);
    }
});

// PUT: Modificar una reserva (ej: horario)
router.put('/:id', logActivity('RESERVA_MODIFICADA', (req) => `Se modificó la reserva ID ${req.params.id}`), async (req, res) => {
    try {
        const updatedBooking = await BookingService.updateBooking(req.params.id, req.body);
        req.io.emit('booking_update', { type: 'updated', booking: updatedBooking });
        res.json(updatedBooking);
    } catch (error) {
        handleBookingError(error, res);
    }
});

// PATCH: Confirmar pago en efectivo
router.patch('/:id/confirm-payment', logActivity('RESERVA_CONFIRMADA', (req) => `Se confirmó el pago de la reserva ID ${req.params.id}`), async (req, res) => {
    try {
        const updatedBooking = await BookingService.confirmPayment(req.params.id, 'Efectivo');
        req.io.emit('booking_update', { type: 'payment_confirmed', booking: updatedBooking });
        res.json(updatedBooking);
    } catch (error) {
        handleBookingError(error, res);
    }
});

// DELETE: Cancelar una reserva (cambia el estado a 'Cancelled')
router.delete('/:id', logActivity('RESERVA_CANCELADA', (req) => `Se canceló la reserva ID ${req.params.id}`), async (req, res) => {
    try {
        const cancelledBooking = await BookingService.cancelBooking(req.params.id, req.body.reason);
        req.io.emit('booking_deleted', cancelledBooking);
        res.json({ message: 'Reserva cancelada correctamente.', booking: cancelledBooking });
    } catch (error) {
        handleBookingError(error, res);
    }
});

module.exports = router;