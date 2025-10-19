const express = require('express');
const router = express.Router();
const { getAvailableTimeSlots, getAvailableCourts } = require('../controllers/availabilityController');

// @route   GET api/availability/slots
// @desc    Get all available time slots for a given date
// @access  Public
router.get('/slots', getAvailableTimeSlots);

// @route   GET api/availability/courts
// @desc    Get all available courts for a given date and time
// @access  Public
router.get('/courts', getAvailableCourts);

module.exports = router;