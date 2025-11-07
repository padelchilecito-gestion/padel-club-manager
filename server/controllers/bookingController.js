const asyncHandler = require('express-async-handler');
const { parseISO, addMinutes } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting');

/**
 * @desc    Crea una nueva reserva (base para ambos métodos de pago).
 * @returns {Promise<object>} La reserva creada.
 */
const createBooking = async (bookingData) => {
    const { courtId, clientName, clientPhone, dateTime, paymentMethod } = bookingData;

    const court = await Court.findById(courtId);
    if (!court) throw new Error('La cancha no existe.');

    const settings = await Setting.findOne({ key: 'SLOT_DURATION' });
    const slotDuration = settings ? parseInt(settings.value, 10) : 90;

    const timeZone = process.env.TZ || 'America/Argentina/Buenos_Aires';
    const startTime = fromZonedTime(parseISO(dateTime), timeZone);
    const endTime = addMinutes(startTime, slotDuration);

    const existingBooking = await Booking.findOne({
        court: courtId,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
        status: { $ne: 'Cancelled' },
    });

    if (existingBooking) throw new Error('Esta cancha ya fue reservada en este horario.');

    const status = paymentMethod === 'Efectivo' ? 'Confirmed' : 'AwaitingPayment';
    const isPaid = paymentMethod === 'Efectivo';

    const booking = await Booking.create({
        court: courtId,
        clientName,
        clientPhone,
        startTime,
        endTime,
        price: court.pricePerHour,
        paymentMethod,
        status,
        isPaid,
    });

    return { booking, court, slotDuration };
};

module.exports = { createBooking };
