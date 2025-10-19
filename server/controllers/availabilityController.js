const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting');
const { startOfDay, endOfDay, setHours, setMinutes, addMinutes, isWithinInterval, parseISO } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');

const getAvailableTimeSlots = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const timeZone = process.env.TZ || 'America/Argentina/Buenos_Aires';
        const start = startOfDay(zonedTimeToUtc(date, timeZone));
        const end = endOfDay(zonedTimeToUtc(date, timeZone));

        const [courts, bookings, settings] = await Promise.all([
            Court.find({ isActive: true }),
            Booking.find({ startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } }),
            Setting.find({ key: ['minTime', 'maxTime', 'slotDuration'] }),
        ]);

        if (courts.length === 0) {
            return res.json([]);
        }

        const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});

        const minTime = settingsMap.minTime || '09:00';
        const maxTime = settingsMap.maxTime || '23:00';
        const slotDuration = parseInt(settingsMap.slotDuration, 10) || 30;

        const allPossibleSlots = [];
        let [startHour, startMinute] = minTime.split(':').map(Number);
        let [endHour, endMinute] = maxTime.split(':').map(Number);

        let currentTime = setMinutes(setHours(start, startHour), startMinute);
        const endTime = setMinutes(setHours(start, endHour), endMinute);

        while (currentTime < endTime) {
            allPossibleSlots.push(new Date(currentTime));
            currentTime = addMinutes(currentTime, slotDuration);
        }

        const availableSlots = allPossibleSlots.filter(slot => {
            const slotEnd = addMinutes(slot, slotDuration);
            const bookingsAtThisTime = bookings.filter(booking => {
                const bookingStart = new Date(booking.startTime);
                const bookingEnd = new Date(booking.endTime);
                return (slot < bookingEnd && slotEnd > bookingStart);
            });
            return bookingsAtThisTime.length < courts.length;
        });

        res.json(availableSlots);

    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAvailableCourts = async (req, res) => {
    try {
        const { date, time } = req.query;
        if (!date || !time) {
            return res.status(400).json({ message: 'Date and time are required' });
        }

        const timeZone = process.env.TZ || 'America/Argentina/Buenos_Aires';
        const selectedTime = zonedTimeToUtc(time, timeZone);
        const start = startOfDay(selectedTime);
        const end = endOfDay(selectedTime);

        const [courts, bookings] = await Promise.all([
            Court.find({ isActive: true }),
            Booking.find({ startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } })
        ]);

        const slotEnd = addMinutes(selectedTime, 60); // Assuming 60 min booking duration for now

        const bookedCourtIds = bookings
            .filter(booking => {
                const bookingStart = new Date(booking.startTime);
                const bookingEnd = new Date(booking.endTime);
                return (selectedTime < bookingEnd && slotEnd > bookingStart);
            })
            .map(booking => booking.court.toString());

        const availableCourts = courts.filter(court => !bookedCourtIds.includes(court._id.toString()));

        res.json(availableCourts);

    } catch (error) {
        console.error('Error fetching available courts:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getAvailableTimeSlots, getAvailableCourts };