const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const FixedBooking = require('../models/FixedBooking');
const CashboxSession = require('../models/CashboxSession');
const ActivityLog = require('../models/ActivityLog');
const { protect, isAdmin } = require('../middleware/auth');

// @desc    Delete all future bookings for a specific user
// @route   POST /api/admin-tasks/delete-user-bookings
// @access  Private/Admin
router.post('/delete-user-bookings', protect, isAdmin, async (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Please provide both name and phone number.' });
    }

    try {
        const result = await Booking.deleteMany({
            'user.name': name,
            'user.phone': phone,
            startTime: { $gte: new Date() }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No future bookings found for this user to delete.' });
        }

        res.status(200).json({ message: `${result.deletedCount} future bookings for ${name} have been deleted.` });

    } catch (error) {
        console.error('Error deleting fixed booking:', error);
        res.status(500).json({ message: 'Server error while trying to delete bookings.' });
    }
});

// RUTA PARA LIMPIAR COLECCIONES DE LA BASE DE DATOS DE FORMA SEGURA
router.post('/clear-collections', protect, isAdmin, async (req, res) => {
    const { collectionsToClear } = req.body;
    if (!collectionsToClear || !Array.isArray(collectionsToClear) || collectionsToClear.length === 0) {
        return res.status(400).json({ message: 'Debes especificar qué colecciones limpiar.' });
    }

    // Lista blanca de colecciones que se pueden limpiar para evitar borrar datos críticos.
    const allowedToClear = ['bookings', 'sales', 'products', 'fixedbookings', 'cashboxsessions', 'activitylogs'];
    const cleared = [];
    const errors = [];

    for (const collectionName of collectionsToClear) {
        if (allowedToClear.includes(collectionName)) {
            try {
                // Usamos Mongoose para acceder a la colección y borrar todos sus documentos
                await mongoose.connection.collection(collectionName).deleteMany({});
                cleared.push(collectionName);
            } catch (error) {
                console.error(`Error al limpiar la colección ${collectionName}:`, error);
                errors.push(collectionName);
            }
        }
    }

    if (errors.length > 0) {
        return res.status(500).json({
            message: `Se completó la operación con errores. No se pudieron limpiar: ${errors.join(', ')}`,
            cleared,
        });
    }

    res.status(200).json({
        message: 'Las colecciones seleccionadas han sido limpiadas con éxito.',
        cleared,
    });
});

module.exports = router;
