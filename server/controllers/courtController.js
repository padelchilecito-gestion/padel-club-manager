const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');

// ✅ Importación correcta para date-fns-tz v3.x
const { parseISO, startOfDay, endOfDay } = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

const { generateTimeSlots } = require('../utils/timeSlotGenerator');

const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';

    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {});
    console.log('CONFIGURACIÓN REDUCIDA:', settings);

    const slotDuration = parseInt(settings.slotDuration, 10);
    if (!settings || !settings.openTime || !settings.closeTime || !slotDuration || slotDuration <= 0) {
      console.error('ERROR: Validación de settings falló. Datos:', settings);
      return res.status(400).json({
        message: 'La configuración del club no está completa. Faltan Hora de Apertura, Cierre o Duración del Turno (debe ser > 0).'
      });
    }

    const allPossibleSlots = generateTimeSlots(settings.openTime, settings.closeTime, slotDuration);

    const activeCourts = await Court.find({ isActive: true }).select('name pricePerHour');
    if (!activeCourts || activeCourts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron canchas activas.' });
    }

    // ✅ Usar fromZonedTime en lugar de zonedTimeToUtc (date-fns-tz v3.x)
    const dateObj = parseISO(date);
    const start = fromZonedTime(startOfDay(dateObj), timeZone);
    const end = fromZonedTime(endOfDay(dateObj), timeZone);

    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' }
    }).select('court startTime');

    const availability = allPossibleSlots.map(slotTime => {
      const slotDateTimeUTC = fromZonedTime(`${date}T${slotTime}:00`, timeZone);

      const bookedCourtIds = bookings.filter(b => b.startTime.getTime() === slotDateTimeUTC.getTime()).map(b => b.court.toString());
      const availableCourts = activeCourts.filter(c => !bookedCourtIds.includes(c._id.toString()));
      if (availableCourts.length > 0) {
        availableCourts.sort((a, b) => a.pricePerHour - b.pricePerHour);
        const cheapestCourt = availableCourts[0];
        return { startTime: slotTime, isAvailable: true, price: cheapestCourt.pricePerHour, courtId: cheapestCourt._id, courtName: cheapestCourt.name };
      } else {
        return { startTime: slotTime, isAvailable: false, price: 0, courtId: null, courtName: null };
      }
    });
    res.json(availability);
  } catch (error) {
    console.error('Error en getAggregatedAvailability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad agregada', error: error.message });
  }
};

const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createCourt = async (req, res) => {
  const { name, courtType, pricePerHour, isActive } = req.body;

  try {
    const court = new Court({ name, courtType, pricePerHour, isActive });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      res.json(court);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateCourt = async (req, res) => {
  const { name, courtType, pricePerHour, isActive } = req.body;
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      court.name = name;
      court.courtType = courtType;
      court.pricePerHour = pricePerHour;
      court.isActive = isActive;

      const updatedCourt = await court.save();
      res.json(updatedCourt);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error("Error al actualizar la cancha:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      await court.deleteOne();
      res.json({ message: 'Court removed' });
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getPublicCourts = async (req, res) => {
  try {
    const courts = await Court.find({ isActive: true });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAvailabilityForPublic = async (req, res) => {
  try {
    const { date, courtId } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';
    const court = await Court.findById(courtId);
    if (!court || !court.isActive) return res.status(404).json({ message: 'Cancha no encontrada o inactiva.' });

    const dateObj = parseISO(date);
    const start = fromZonedTime(startOfDay(dateObj), timeZone);
    const end = fromZonedTime(endOfDay(dateObj), timeZone);

    const bookings = await Booking.find({ court: courtId, startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } });

    const availableSlots = court.availableSlots || [];

    const availability = availableSlots.map(slotTime => {
      const slotDateTimeUTC = fromZonedTime(`${date}T${slotTime}:00`, timeZone);
      const isBooked = bookings.some(b => b.startTime.getTime() === slotDateTimeUTC.getTime());
      return { startTime: slotTime, isAvailable: !isBooked };
    });
    res.json(availability);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad' });
  }
};

module.exports = {
  getAggregatedAvailability,
  getCourts,
  createCourt,
  getCourtById,
  updateCourt,
  deleteCourt,
  getPublicCourts,
  getAvailabilityForPublic,
};
