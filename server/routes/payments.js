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

    // --- Verificación de Configuración Crítica ---
    const notification_url = process.env.YOUR_BACKEND_URL
        ? `${process.env.YOUR_BACKEND_URL}/api/payments/webhook`
        : null;

    if (!notification_url) {
        console.error("CRITICAL: La variable de entorno YOUR_BACKEND_URL no está configurada. No se pueden crear preferencias de pago para el TPV.");
        return res.status(500).send("Error de configuración del servidor: la URL de notificación es requerida.");
    }

    try {
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadoPagoAccessToken) {
            console.error("CRITICAL: El Access Token de Mercado Pago no está configurado en los ajustes de la aplicación.");
            return res.status(500).send("Error de configuración: El Access Token de Mercado Pago no está configurado.");
        }

        mercadopago.configure({
            access_token: settings.mercadoPagoAccessToken
        });

        // --- Lógica de Creación ---
        const pendingSale = new PendingSale({ items, total });
        await pendingSale.save();

        const preference = {
            items: items.map(item => ({
                title: item.name,
                unit_price: item.price,
                quantity: item.quantity,
            })),
            back_urls: {
                success: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}/admin`,
            },
            auto_return: 'approved',
            external_reference: pendingSale._id.toString(),
            notification_url: notification_url, // Usar la URL validada
        };

        const response = await mercadopago.preferences.create(preference);
        res.json({ init_point: response.body.init_point, pendingId: pendingSale._id });

    } catch (error) {
        console.error("Error al crear la preferencia de pago del TPV:", error);
        res.status(500).json({ message: 'No se pudo crear la preferencia de pago para la venta.' });
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

const PaymentService = require('../services/payment-service');

router.post('/webhook', async (req, res) => {
    const payment = req.query;
    console.log("Notificación de Webhook recibida:", payment);

    try {
        if (payment.type !== 'payment') {
            console.log("Notificación ignorada: no es de tipo 'payment'.");
            return res.status(204).send();
        }

        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadoPagoAccessToken) {
            console.error("CRITICAL: Access Token de Mercado Pago no configurado en el webhook.");
            return res.status(500).send("Access Token no configurado.");
        }

        mercadopago.configure({ access_token: settings.mercadoPagoAccessToken });
        const data = await mercadopago.payment.findById(payment['data.id']);
        const externalReference = data.body.external_reference;
        console.log(`Procesando referencia externa: ${externalReference}`);

        if (data.body.status === 'approved') {
            console.log(`Pago aprobado para la referencia: ${externalReference}`);

            // Intentar procesar como venta de POS. Si no lo es, devuelve null.
            const sale = await PaymentService.processPosSale(externalReference, req.io);
            if (sale) {
                console.log(`Referencia ${externalReference} procesada como venta de POS.`);
                return res.status(200).send();
            }

            // Si no fue una venta de POS, intentar procesar como una reserva.
            const booking = await PaymentService.processBookingPayment(externalReference, req.io);
            if (booking) {
                console.log(`Referencia ${externalReference} procesada como reserva.`);
                return res.status(200).send();
            }

            console.warn(`La referencia externa ${externalReference} no corresponde a ninguna venta o reserva pendiente.`);

        } else {
            console.log(`Estado de pago no aprobado para la referencia ${externalReference}: ${data.body.status}`);
        }

        res.status(204).send();
    } catch (error) {
        console.error("Error catastrófico en el webhook:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;