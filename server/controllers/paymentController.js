const asyncHandler = require('express-async-handler');
const mercadopago = require('../config/mercadopago');
const Booking = require('../models/Booking');

/**
 * @desc    Crea una preferencia de pago en Mercado Pago para una reserva.
 * @param   {object} booking - La reserva creada.
 * @param   {object} court - La cancha reservada.
 * @param   {number} slotDuration - La duración del turno.
 * @returns {Promise<object>} El objeto de la preferencia de MP.
 */
const createMercadoPagoPreference = async (booking, court, slotDuration) => {
    const preference = {
        items: [{
            title: `Reserva de cancha: ${court.name}`,
            description: `Turno de ${slotDuration} min.`,
            unit_price: booking.price,
            quantity: 1,
            currency_id: 'ARS',
        }],
        back_urls: {
            success: `${process.env.CLIENT_URL}/booking-success?bookingId=${booking._id}`,
            failure: `${process.env.CLIENT_URL}/booking-failure`,
        },
        auto_return: 'approved',
        external_reference: `booking:${booking._id}`,
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
    };

    const response = await mercadopago.preferences.create(preference);
    return response.body;
};


/**
 * @desc    Maneja los webhooks de Mercado Pago.
 * @route   POST /api/payments/webhook
 * @access  Public
 */
const handleWebhook = asyncHandler(async (req, res) => {
    const payment = req.body;

    if (payment.type === 'payment') {
        const data = await mercadopago.payment.findById(payment.data.id);
        const { status, external_reference } = data.body;

        if (status === 'approved' && external_reference.startsWith('booking:')) {
            const bookingId = external_reference.split(':')[1];
            const booking = await Booking.findById(bookingId);

            if (booking && !booking.isPaid) {
                booking.status = 'Confirmed';
                booking.isPaid = true;
                await booking.save();
                console.log(`Reserva ${bookingId} confirmada por webhook.`);
                // Aquí se podría emitir un evento de Socket.IO en el futuro
            }
        }
    }
    res.sendStatus(200);
});

module.exports = {
    createMercadoPagoPreference,
    handleWebhook,
};
