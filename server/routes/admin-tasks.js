const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
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

module.exports = router;
