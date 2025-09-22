const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET: Obtener la configuración actual
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { configKey: "main_settings" }, 
            { $setOnInsert: { configKey: "main_settings" } },
            { upsert: true, new: true }
        );
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la configuración." });
    }
});

// POST: Guardar o actualizar la configuración
router.post('/', async (req, res) => {
    try {
        const { mercadoPagoPublicKey, mercadoPagoAccessToken, whatsappNumber } = req.body;
        const updatedSettings = await Settings.findOneAndUpdate(
            { configKey: "main_settings" },
            { mercadoPagoPublicKey, mercadoPagoAccessToken, whatsappNumber }, // Añadido whatsappNumber
            { upsert: true, new: true }
        );
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: "Error al guardar la configuración." });
    }
});

module.exports = router;