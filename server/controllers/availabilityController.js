const asyncHandler = require('express-async-handler');
const { parseISO, getDay, addMinutes } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting');
const { generateTimeSlots } = require('../utils/timeSlotGenerator');

/**
 * @desc    Obtener los horarios disponibles para un día.
 * @route   GET /api/availability/slots/:date
 * @access  Public
 */
const getTimeSlots = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const dateObj = parseISO(date);
    const dayIndex = getDay(dateObj);
    const dayKeys = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayKeys[dayIndex];

    const settings = await Setting.find({});
    const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

    if (settingsMap[`${dayName}_IS_OPEN`] !== 'true') {
        return res.json([]);
    }

    const startTime = settingsMap[`${dayName}_OPENING_HOUR`];
    const endTime = settingsMap[`${dayName}_CLOSING_HOUR`];
    const slotDuration = parseInt(settingsMap['SLOT_DURATION'], 10);

    if (!startTime || !endTime || !slotDuration) {
        res.status(500);
        throw new Error('La configuración de horarios del club está incompleta.');
    }

    const slots = generateTimeSlots(startTime, endTime, slotDuration);
    res.status(200).json(slots);
});

/**
 * @desc    Obtener canchas disponibles para un fecha y hora.
 * @route   GET /api/availability/courts
 * @access  Public
 */
const getAvailableCourts = asyncHandler(async (req, res) => {
    const { dateTime } = req.query;

    if (!dateTime) {
        res.status(400);
        throw new Error('Se requiere fecha y hora (dateTime).');
    }

    const settings = await Setting.findOne({ key: 'SLOT_DURATION' });
    const slotDuration = settings ? parseInt(settings.value, 10) : 90;

    const timeZone = process.env.TZ || 'America/Argentina/Buenos_Aires';
    const startTime = fromZonedTime(parseISO(dateTime), timeZone);
    const endTime = addMinutes(startTime, slotDuration);

    const overlappingBookings = await Booking.find({
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
        status: { $ne: 'Cancelled' },
    }).select('court');

    const bookedCourtIds = overlappingBookings.map(b => b.court.toString());

    const availableCourts = await Court.find({
        _id: { $nin: bookedCourtIds },
        isActive: true,
    }).sort({ name: 1 });

    res.status(200).json(availableCourts);
});

module.exports = {
    getTimeSlots,
    getAvailableCourts,
};
