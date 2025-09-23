const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PendingPayment = require('../models/PendingPayment');
const PendingSale = require('../models/PendingSale');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const BookingService = require('../services/booking-service');
const Settings = require('../models/Settings');

// Función auxiliar para inicializar el cliente de MercadoPago
const getMercadoPagoClient = async () => {
    const settings = await Settings.findOne({ configKey: "main_settings" });
    if (!settings || !settings.mercadoPagoAccessToken) {
        throw new Error("El Access Token de Mercado Pago no está configurado.");
    }
    return new MercadoPagoConfig({ accessToken: settings.mercadoPagoAccessToken });
};

router.post('/create-preference', async (req, res) => {
    const { courtId, slots, user, total, date } = req.body;

    try {
        const client = await getMercadoPagoClient();

        const pendingPayment = new PendingPayment({
            court: courtId,
            slots,
            user,
            total,
            date
        });
        await pendingPayment.save();

        const preferenceBody = {
            items: [{
                title: `Reserva de ${slots.length} turno(s)`,
                unit_price: Number(total),
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

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        res.json({ id: result.id, pending_id: pendingPayment._id });

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
    const { query } = req;

    try {
        if (query.type !== 'payment') {
            return res.status(204).send();
        }

        const client = await getMercadoPagoClient();
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: query['data.id'] });

        if (paymentData.status !== 'approved') {
            return res.status(204).send();
        }

        const externalReference = paymentData.external_reference;

        // Diferenciar entre venta de POS y reserva de cancha
        if (query.source === 'pos') {
            const pendingSale = await PendingSale.findById(externalReference);
            if (pendingSale) {
                const session = await mongoose.startSession();
                session.startTransaction();
                try {
                    const sale = new Sale({
                        items: pendingSale.items,
                        total: pendingSale.total,
                        paymentMethod: pendingSale.paymentMethod
                    });
                    await sale.save({ session });

                    for (const item of pendingSale.items) {
                         await Product.findByIdAndUpdate(item.product,
                            { $inc: { stock: -item.quantity } },
                            { session, new: true }
                        );
                    }
                    await session.commitTransaction();

                    // Notificar al frontend si es necesario (ej. via Socket.IO)
                    req.io.emit('pos_sale_confirmed', sale);

                    await PendingSale.findByIdAndDelete(externalReference);

                } catch (error) {
                    await session.abortTransaction();
                    throw error; // Dejar que el catch principal lo maneje
                } finally {
                    session.endSession();
                }
            }
        } else {
            // Lógica existente para reservas de canchas
            const pendingPayment = await PendingPayment.findById(externalReference);
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
                await PendingPayment.findByIdAndDelete(externalReference);
            }
        }

        res.status(204).send();

    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;