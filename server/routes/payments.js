const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');
const PendingPayment = require('../models/PendingPayment');
const PendingSale = require('../models/PendingSale');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const BookingService = require('../services/booking-service');
const Settings = require('../models/Settings');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

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

router.post('/create-pos-preference', async (req, res) => {
    const { items, total } = req.body;

    try {
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadoPagoAccessToken) {
            return res.status(500).send("El Access Token de Mercado Pago no está configurado.");
        }

        mercadopago.configure({
            access_token: settings.mercadoPagoAccessToken
        });

        // Guardamos la venta como pendiente
        const pendingSale = new PendingSale({ items, total });
        await pendingSale.save();

        const preference = {
            items: items.map(item => ({
                title: item.name, // Necesitaremos pasar el nombre desde el frontend
                unit_price: item.price,
                quantity: item.quantity,
            })),
            back_urls: {
                success: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}/admin`, // Redirige al admin
            },
            auto_return: 'approved',
            external_reference: pendingSale._id.toString(),
            notification_url: `${process.env.YOUR_BACKEND_URL}/api/payments/webhook` // ¡MUY IMPORTANTE!
        };

        const response = await mercadopago.preferences.create(preference);
        // Enviamos el link que se convertirá en QR
        res.json({ init_point: response.body.init_point, pendingId: pendingSale._id });

    } catch (error) {
        console.error("Error creating POS preference:", error);
        res.status(500).json({ message: 'Error al crear la preferencia de pago para la venta.' });
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
            return res.status(500).send("Access Token no configurado.");
        }
        mercadopago.configure({ access_token: settings.mercadoPagoAccessToken });

        if (payment.type === 'payment') {
            const data = await mercadopago.payment.findById(payment['data.id']);
            const externalReference = data.body.external_reference;

            if (data.body.status === 'approved') {
                // Primero, intentamos procesarlo como una venta de POS
                const pendingSale = await PendingSale.findById(externalReference);
                if (pendingSale) {
                    const sale = new Sale({
                        items: pendingSale.items,
                        total: pendingSale.total,
                        paymentMethod: 'MercadoPago'
                    });
                    await sale.save();

                    for (const item of pendingSale.items) {
                        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
                    }

                    // Emitir evento para notificar al frontend en tiempo real
                    req.io.emit('pos_payment_success', { saleId: sale._id, pendingId: pendingSale._id });
                    await PendingSale.findByIdAndDelete(externalReference);

                } else {
                    // Si no es una venta, intentamos procesarlo como una reserva (lógica que ya tenías)
                    const pendingBooking = await PendingPayment.findById(externalReference);
                    if (pendingBooking) {
                        const court = await Court.findById(pendingBooking.court);
                        const bookingsToCreate = pendingBooking.slots.map(slot => {
                            const startTime = new Date(pendingBooking.date);
                            startTime.setHours(slot.hour, slot.minute, 0, 0);
                            const endTime = new Date(startTime.getTime() + 30 * 60000);
                            return {
                                court: pendingBooking.court,
                                startTime,
                                endTime,
                                user: pendingBooking.user,
                                status: 'Confirmed',
                                isPaid: true,
                                paymentMethod: 'MercadoPago',
                                price: court.pricePerHour / 2,
                            };
                        });
                        const createdBookings = await BookingService.createFixedBookings(bookingsToCreate);
                        createdBookings.forEach(b => req.io.emit('booking_update', b));
                        await PendingPayment.findByIdAndDelete(externalReference);
                    }
                }
            }
        }
        res.status(204).send();
    } catch (error) {
        console.log("Webhook error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;