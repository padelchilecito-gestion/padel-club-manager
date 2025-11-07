const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { createBooking } = require('../controllers/bookingController');
const { createMercadoPagoPreference } = require('../controllers/paymentController');

// @route   POST /api/bookings/cash
// @desc    Crea una nueva reserva con pago en efectivo.
router.post('/cash', asyncHandler(async (req, res) => {
    const { booking } = await createBooking({ ...req.body, paymentMethod: 'Efectivo' });
    res.status(201).json(booking);
}));

// @route   POST /api/bookings/mercadopago
// @desc    Crea una reserva y una preferencia de Mercado Pago.
router.post('/mercadopago', asyncHandler(async (req, res) => {
    const { booking, court, slotDuration } = await createBooking({ ...req.body, paymentMethod: 'MercadoPago' });
    const preference = await createMercadoPagoPreference(booking, court, slotDuration);
    res.status(201).json({ booking, init_point: preference.init_point });
}));

module.exports = router;
