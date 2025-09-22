const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings'); // 1. Importar el modelo de configuración

router.post('/create_preference', async (req, res) => {
    try {
        // 2. Obtener el Access Token desde la base de datos
        const settings = await Settings.findOne({ configKey: "main_settings" });
        if (!settings || !settings.mercadoPagoAccessToken) {
            return res.status(500).send("El Access Token de Mercado Pago no está configurado.");
        }
        
        // Configurar Mercado Pago con el token obtenido
        mercadopago.configure({
            access_token: settings.mercadoPagoAccessToken
        });

        const { bookingId, title, unit_price } = req.body;

        let preference = {
            items: [{
                title: title,
                unit_price: Number(unit_price),
                quantity: 1,
            }],
            back_urls: {
                success: "http://localhost:5173", // URL a la que volverá el usuario
                failure: "http://localhost:5173",
                pending: ""
            },
            auto_return: "approved",
            external_reference: bookingId,
        };
        
        const response = await mercadopago.preferences.create(preference);
        res.json({ id: response.body.id });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error al crear la preferencia de pago.");
    }
});

// La ruta de webhook se mantiene igual...
router.post('/webhook', async (req, res) => {
    // ...
});

module.exports = router;