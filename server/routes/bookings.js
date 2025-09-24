const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const BookingService = require('../services/booking-service');
const logActivity = require('../middleware/logActivity');

// GET: Obtener todas las reservas para un rango de fechas (para el calendario)
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query; // Fechas en formato ISO
        const bookings = await Booking.find({
            startTime: { $gte: new Date(start) },
            endTime: { $lte: new Date(end) }
        }).populate('court'); // populate para incluir datos de la cancha
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las reservas.' });
    }
});

// POST: Crear una nueva reserva (ruta ahora legacy, preferir /bulk)
router.post('/', logActivity('RESERVA_CREADA', (req) => `El cliente ${req.body.user.name} reservó en la cancha ID ${req.body.court}`), async (req, res) => {
    try {
        // Reutiliza la lógica de createBooking para una sola reserva
        const newBooking = await BookingService.createBooking(req.body);
        req.io.emit('booking_update', { type: 'created', booking: newBooking });
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// POST: Crear múltiples reservas en una sola transacción
router.post('/bulk', logActivity('RESERVA_MULTIPLE_CREADA', (req) => `El cliente ${req.body.user.name} realizó ${req.body.bookings.length} reservas.`), async (req, res) => {
    try {
        const { bookings, user } = req.body;

        // Añadimos la info del usuario a cada reserva
        const bookingsWithUser = bookings.map(b => ({ ...b, user }));

        const createdBookings = await BookingService.createBulkBookings(bookingsWithUser);

        // Emitir un solo evento con todas las reservas nuevas
        req.io.emit('booking_bulk_update', { type: 'created_bulk', bookings: createdBookings });

        res.status(201).json(createdBookings);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// POST: Crear una nueva reserva para pago en efectivo
router.post('/cash', logActivity('RESERVA_PENDIENTE_CREADA', (req) => `El cliente ${req.body.user.name} reservó para pagar en efectivo`), async (req, res) => {
    try {
        // La lógica de creación se moverá a BookingService en el siguiente paso
        const newBooking = await BookingService.createCashBooking(req.body);
        req.io.emit('booking_update', newBooking);
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// PUT: Modificar el horario de una reserva
router.put('/:id', logActivity('RESERVA_MODIFICADA', (req) => `Se cambió la reserva ID ${req.params.id} al nuevo horario ${new Date(req.body.startTime).toLocaleString()}`), async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        const bookingId = req.params.id;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: "Se requiere una nueva hora de inicio y fin." });
        }

        const requestedStartTime = new Date(startTime);
        const requestedEndTime = new Date(endTime);

        const currentBooking = await Booking.findById(bookingId);
        if (!currentBooking) {
            return res.status(404).json({ message: "Reserva no encontrada." });
        }

        const conflictingBooking = await Booking.findOne({
            _id: { $ne: bookingId },
            court: currentBooking.court,
            startTime: { $lt: requestedEndTime },
            endTime: { $gt: requestedStartTime },
            status: { $in: ['Confirmed', 'Pending'] }
        });

        if (conflictingBooking) {
            return res.status(409).json({ message: "El nuevo horario no está disponible en esta cancha." });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { startTime: requestedStartTime, endTime: requestedEndTime },
            { new: true }
        ).populate('court');

        req.io.emit('booking_update', { type: 'updated', booking: updatedBooking });
        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la reserva.", error: error.message });
    }
});

// PATCH para modificar solo el estado de una reserva
router.patch('/:id/status', logActivity('RESERVA_MODIFICADA', (req) => `Se cambió el estado de la reserva ID ${req.params.id} a ${req.body.status}`), async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        if (!status || !['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: "Estado no válido." });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: status },
            { new: true }
        ).populate('court');
        
        if (!updatedBooking) {
             return res.status(404).json({ message: "Reserva no encontrada." });
        }
        
        req.io.emit('booking_update', { type: 'status_changed', booking: updatedBooking });
        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el estado de la reserva." });
    }
});

// PATCH: Marcar una reserva como pagada
router.patch('/:id/pay', logActivity('RESERVA_MODIFICADA', (req) => `Se marcó como pagada la reserva ID ${req.params.id} con método ${req.body.paymentMethod}`), async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        if (!paymentMethod || paymentMethod === 'Pendiente') {
            return res.status(400).json({ message: "Método de pago no válido." });
        }
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { isPaid: true, paymentMethod: paymentMethod, status: 'Confirmed' },
            { new: true }
        ).populate('court');

        if (!updatedBooking) {
            return res.status(404).json({ message: "Reserva no encontrada." });
        }

        req.io.emit('booking_update', { type: 'payment_updated', booking: updatedBooking });
        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: "Error al registrar el pago de la reserva." });
    }
});

// PATCH: Confirmar un pago en efectivo que estaba pendiente
router.patch('/:id/confirm-payment', logActivity('RESERVA_CONFIRMADA', (req) => `Se confirmó el pago en efectivo de la reserva ID ${req.params.id}`), async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Confirmed',
                isPaid: true,
                paymentMethod: 'Efectivo' // Aseguramos el método de pago
            },
            { new: true }
        ).populate('court');

        if (!updatedBooking) {
            return res.status(404).json({ message: "Reserva no encontrada." });
        }

        req.io.emit('booking_update', { type: 'payment_confirmed', booking: updatedBooking });
        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: "Error al confirmar el pago de la reserva." });
    }
});


const Court = require('../models/Court');

// POST for fixed bookings
router.post('/fixed', logActivity('RESERVA_FIJA_CREADA', (req) => `Creación de turno fijo para ${req.body.user.name}`), async (req, res) => {
    const { court: courtId, user, dayOfWeek, time, endDate } = req.body;

    try {
        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ message: "Cancha no encontrada." });
        }

        const [hour, minute] = time.split(':');
        let startDate = new Date();
        let realEndDate = new Date(endDate);
        realEndDate.setUTCHours(23, 59, 59, 999);

        let bookingsToCreate = [];
        let currentDate = startDate;

        while (currentDate.getDay() !== parseInt(dayOfWeek)) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        while (currentDate <= realEndDate) {
            const startTime = new Date(currentDate);
            startTime.setUTCHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
            const endTime = new Date(startTime.getTime() + 30 * 60000);

            bookingsToCreate.push({
                court: courtId,
                startTime,
                endTime,
                user,
                status: 'Confirmed',
                price: court.pricePerHour / 2, // Assuming 30 min booking
            });
            currentDate.setDate(currentDate.getDate() + 7);
        }

        const createdBookings = await BookingService.createFixedBookings(bookingsToCreate);

        // Emit socket events for each created booking
        createdBookings.forEach(b => req.io.emit('booking_update', b));

        res.status(201).json({ message: `Se crearon ${createdBookings.length} reservas fijas.` });

    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// DELETE (Admin): Elimina una reserva por completo
router.delete('/:id', logActivity('RESERVA_ELIMINADA', (req) => `Se eliminó la reserva con ID ${req.params.id}`), async (req, res) => {
    try {
        const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
        if (!deletedBooking) {
            return res.status(404).json({ message: "Reserva no encontrada." });
        }
        
        req.io.emit('booking_deleted', deletedBooking);
        
        res.json({ message: 'Reserva eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la reserva." });
    }
});

module.exports = router;