const express = require('express');
const router = express.Router();
const path = require('path'); // <-- Añadir esta línea

// --- CAMBIO CLAVE: Rutas absolutas para los módulos locales ---
const { MercadoPagoConfig, Preference } = require('mercadopago');
const PendingPayment = require(path.join(__dirname, '..', 'models', 'PendingPayment.js'));
const PendingSale = require(path.join(__dirname, '..', 'models', 'PendingSale.js'));
const Settings = require(path.join(__dirname, '..', 'models', 'Settings.js'));
const PaymentService = require(path.join(__dirname, '..', 'services', 'payment-service.js'));

// (El resto del código del archivo permanece igual, aquí se omite por brevedad,
// pero asegúrate de que tu archivo completo siga a continuación de estas importaciones)

// Ruta para crear preferencia de pago para reservas
router.post('/create-preference', async (req, res) => {
    const { courtId, slots, user, total, date } = req.body;

    try {
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadopagoAccessToken) {
            return res.status(500).send("El Access Token de Mercado Pago no está configurado.");
        }

        const client = new MercadoPagoConfig({
            accessToken: settings.mercadopagoAccessToken
        });

        const pendingPayment = new PendingPayment({
            court: courtId,
            slots,
            user,
            total,
            date
        });
        await pendingPayment.save();

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
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
            }
        });

        res.json({ id: response.id, pending_id: pendingPayment._id });

    } catch (error) {
        console.error("Error creating preference:", error);
        res.status(500).json({ message: 'Error al crear la preferencia de pago.' });
    }
});

// Ruta para crear preferencia de pago en el Punto de Venta (POS)
router.post('/create-pos-preference', async (req, res) => {
    const { items, total } = req.body;

    const notification_url = process.env.YOUR_BACKEND_URL
        ? `${process.env.YOUR_BACKEND_URL}/api/payments/webhook`
        : null;

    if (!notification_url) {
        console.error("CRITICAL: La variable de entorno YOUR_BACKEND_URL no está configurada.");
        return res.status(500).send("Error de configuración del servidor.");
    }

    try {
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadopagoAccessToken) {
            return res.status(500).send("Error de configuración: El Access Token de Mercado Pago no está configurado.");
        }

        const client = new MercadoPagoConfig({
            accessToken: settings.mercadopagoAccessToken
        });

        const pendingSale = new PendingSale({ items, total });
        await pendingSale.save();

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
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
                notification_url: notification_url,
            }
        });

        res.json({ init_point: response.init_point, pendingId: pendingSale._id });

    } catch (error) {
        console.error("Error al crear la preferencia de pago del TPV:", error);
        res.status(500).json({ message: 'No se pudo crear la preferencia de pago para la venta.' });
    }
});

// Ruta para obtener detalles de un pago pendiente
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

// Webhook para notificaciones de pago
router.post('/webhook', async (req, res) => {
    const paymentQuery = req.query;
    console.log("Notificación de Webhook recibida:", paymentQuery);

    try {
        if (paymentQuery.type !== 'payment') {
            return res.status(204).send();
        }

        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadopagoAccessToken) {
            return res.status(500).send("Access Token no configurado.");
        }

        const { Payment } = require('mercadopago');
        const client = new MercadoPagoConfig({ accessToken: settings.mercadopagoAccessToken });
        const paymentClient = new Payment(client);

        const data = await paymentClient.get({ id: paymentQuery['data.id'] });

        if (data && data.external_reference && data.status === 'approved') {
            const externalReference = data.external_reference;
            console.log(`Pago aprobado para la referencia: ${externalReference}`);

            const sale = await PaymentService.processPosSale(externalReference, req.io);
            if (sale) {
                console.log(`Referencia ${externalReference} procesada como venta de POS.`);
                return res.status(200).send();
            }

            const booking = await PaymentService.processBookingPayment(externalReference, req.io);
            if (booking) {
                console.log(`Referencia ${externalReference} procesada como reserva.`);
                return res.status(200).send();
            }

            console.warn(`Referencia ${externalReference} no corresponde a ninguna venta o reserva.`);
        }

        res.status(204).send();
    } catch (error) {
        console.error("Error catastrófico en el webhook:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
