const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');
const PendingPayment = require('../models/PendingPayment');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const BookingService = require('../services/booking-service');
const Settings = require('../models/Settings');

router.post('/create-preference', async (req, res) => {
    const { courtId, slots, user, total, date } = req.body;

    try {
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadoPagoAccessToken) {
            return res.status(500).send("El Access Token de Mercado Pago no está configurado.");
        }

        mercadopago.configure({
            access_token: settings.mercadoPagoAccessToken
        });

        const pendingPayment = new PendingPayment({
            court: courtId,
            slots,
            user,
            total,
            date
        });
        await pendingPayment.save();

        let preference = {
            items: [{
                title: `Reserva de ${slots.length} turno(s)`,
                unit_price: total,
                quantity: 1,
            }],
            back_urls: {
                success: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}/payment-success`,
                failure: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}`,
                pending: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}`
            },
            auto_return: 'approved',
            external_reference: pendingPayment._id.toString(),
        };

        const response = await mercadopago.preferences.create(preference);
        res.json({ id: response.body.id, pending_id: pendingPayment._id });

    } catch (error) {
        console.error("Error creating preference:", error);
        res.status(500).json({ message: 'Error al crear la preferencia de pago.' });
    }
});

router.get('/pending/:id', async (req, res) => {
    try {
        const pendingPayment = await PendingPayment.findById(req.params.id).populate('court');
        if (!pendingPayment) {
            return res.status(404).json({ message: 'Pago pendiente no encontrado.' });
        }
        const settings = await Settings.findOne({ configKey: "main_settings" });
        const adminWpp = settings ? settings.whatsappNumber : '';

        res.json({ ...pendingPayment.toObject(), adminWpp });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los detalles del pago pendiente.' });
    }
});

router.post('/webhook', async (req, res) => {
    const payment = req.query;
    try {
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadoPagoAccessToken) {
            return res.status(500).send("El Access Token de Mercado Pago no está configurado.");
        }

        mercadopago.configure({
            access_token: settings.mercadoPagoAccessToken
        });

        if (payment.type === 'payment') {
            const data = await mercadopago.payment.findById(payment['data.id']);
            const pendingPaymentId = data.body.external_reference;

            if (data.body.status === 'approved') {
                const pendingPayment = await PendingPayment.findById(pendingPaymentId);
                if (pendingPayment) {
                    const court = await Court.findById(pendingPayment.court);

                    const bookingsToCreate = pendingPayment.slots.map(slot => {
                        const startTime = new Date(pendingPayment.date);
                        startTime.setHours(slot.hour, slot.minute, 0, 0);
                        const endTime = new Date(startTime.getTime() + 30 * 60000);

                        return {
                            court: pendingPayment.court,
                            startTime,
                            endTime,
                            user: pendingPayment.user,
                            status: 'Confirmed',
                            price: court.pricePerHour / 2,
                        };
                    });

                    const createdBookings = await BookingService.createFixedBookings(bookingsToCreate);
                    createdBookings.forEach(b => req.io.emit('booking_update', b));

                    await PendingPayment.findByIdAndDelete(pendingPaymentId);
                }
            }
        }
        res.status(204).send();
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;