const express = require('express');
const router = express.Router();
const {
    getTimeSlots,
    getAvailableCourts,
} = require('../controllers/availabilityController');

// @route   GET /api/availability/slots/:date
// @desc    Obtiene los horarios (slots) de un día.
router.get('/slots/:date', getTimeSlots);

// @route   GET /api/availability/courts?dateTime=...
// @desc    Obtiene las canchas disponibles para un horario.
router.get('/courts', getAvailableCourts);

module.exports = router;
