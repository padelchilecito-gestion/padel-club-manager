const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
// --- CORRECCIÓN DE IMPORTACIÓN ---
const dateFnsTz = require('date-fns-tz');
// --- FIN DE CORRECCIÓN ---
const { generateTimeSlots } = require('../utils/timeSlotGenerator');

const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params; // 'date' es un string 'yyyy-MM-dd'
    const timeZone = 'America/Argentina/Buenos_Aires';

    // 1. Buscar settings
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    console.log('CONFIGURACIÓN REDUCIDA:', settings);

    // 2. Parsear y validar slotDuration
    const slotDuration = parseInt(settings.slotDuration, 10);
    if (!settings || !settings.openTime || !settings.closeTime || !slotDuration || slotDuration <= 0) {
      console.error('ERROR: Validación de settings falló. Datos:', settings);
      return res.status(400).json({
        message: 'La configuración del club no está completa. Faltan Hora de Apertura, Cierre o Duración del Turno (debe ser > 0).'
      });
    }

    // 3. Generar slots
    const allPossibleSlots = generateTimeSlots(settings.openTime, settings.closeTime, slotDuration);

    // 4. Buscar canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('name pricePerHour');
    if (!activeCourts || activeCourts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron canchas activas.' });
    }

    // 5. Buscar reservas del día
    // --- CORRECCIÓN DE USO ---
    const start = dateFnsTz.startOfDay(date, { timeZone });
    const end = dateFnsTz.endOfDay(date, { timeZone });
    // --- FIN DE CORRECCIÓN ---

    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end },
      status: { $ne: 'Cancelled' }
    }).select('court startTime');

    // 6. Mapear disponibilidad
    const availability = allPossibleSlots.map(slotTime => {
      // --- CORRECCIÓN DE USO ---
      const slotDateTimeUTC = dateFnsTz.zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);
      // --- FIN DE CORRECCIÓN ---

      const bookedCourtIds = bookings
        .filter(b => b.startTime.getTime() === slotDateTimeUTC.getTime())
        .map(b => b.court.toString());

      const availableCourts = activeCourts.filter(
        c => !bookedCourtIds.includes(c._id.toString())
      );

      if (availableCourts.length > 0) {
        availableCourts.sort((a, b) => a.pricePerHour - b.pricePerHour);
        const cheapestCourt = availableCourts[0];
        return {
          startTime: slotTime, isAvailable: true, price: cheapestCourt.pricePerHour,
          courtId: cheapestCourt._id, courtName: cheapestCourt.name,
        };
      } else {
        return { startTime: slotTime, isAvailable: false, price: 0, courtId: null, courtName: null };
      }
    });

    res.json(availability);

  } catch (error) {
    console.error('Error en getAggregatedAvailability:', error); // Log del error
    res.status(500).json({ message: 'Error al obtener la disponibilidad agregada', error: error.message });
  }
};


/* --- CÓDIGO ORIGINAL (sin cambios aquí abajo) --- */

// @desc    (Admin) Get all courts
const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    (Admin) Create a court
const createCourt = async (req, res) => {
  const {
    name,
    courtType,
    pricePerHour,
    isActive,
  } = req.body;

  try {
    const court = new Court({
      name,
      courtType,
      pricePerHour,
      isActive,
    });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    (Admin) Get court by ID
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

// @desc    (Admin) Update court
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

// @desc    (Admin) Delete court
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


// @desc    (Public) Get active courts
const getPublicCourts = async (req, res) => {
  try {
    const courts = await Court.find({ isActive: true });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    (Public) Get availability for a specific court (Lógica antigua, necesita corrección)
const getAvailabilityForPublic = async (req, res) => {
  try {
    const { date, courtId } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';
    const court = await Court.findById(courtId);
    if (!court || !court.isActive) return res.status(404).json({ message: 'Cancha no encontrada o inactiva.' });

    // --- CORRECCIÓN DE USO ---
    const start = dateFnsTz.startOfDay(date, { timeZone });
    const end = dateFnsTz.endOfDay(date, { timeZone });
    // --- FIN DE CORRECCIÓN ---

    const bookings = await Booking.find({
      court: courtId, startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' },
    });

    const availableSlots = court.availableSlots || [];
    const availability = availableSlots.map(slotTime => {
      // --- CORRECCIÓN DE USO ---
      const slotDateTimeUTC = dateFnsTz.zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);
      // --- FIN DE CORRECCIÓN ---
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
