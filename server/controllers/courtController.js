const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting'); // <-- CORRECCIÓN 1: Importar el modelo Setting
const { zonedTimeToUtc, startOfDay, endOfDay } = require('date-fns-tz');
const { generateTimeSlots } = require('../utils/timeSlotGenerator'); // <-- CORRECCIÓN 2: Esto ahora funcionará

// --- NUEVA FUNCIÓN (Punto 1) ---
// Obtiene la disponibilidad agregada (fecha primero)
const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';

    // --- CORRECCIÓN 1: Buscar settings directamente en la BD ---
    const settings = await Setting.findOne(); 
    
    if (!settings || !settings.openTime || !settings.closeTime || !settings.slotDuration) {
      return res.status(400).json({ message: 'La configuración del club no está completa.' });
    }

    // 2. Generar todos los slots posibles para ese día
    const allPossibleSlots = generateTimeSlots(
      settings.openTime,
      settings.closeTime,
      settings.slotDuration
    );

    // 3. Obtener todas las canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('name pricePerHour');

    if (!activeCourts || activeCourts.length === 0) {
        return res.status(404).json({ message: 'No se encontraron canchas activas.' });
    }

    // 4. Obtener todas las reservas (bookings) para ese día
    const start = startOfDay(zonedTimeToUtc(date, timeZone));
    const end = endOfDay(zonedTimeToUtc(date, timeZone));
    
    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end },
      status: { $ne: 'Cancelled' }
    }).select('court startTime');

    // 5. Mapear la disponibilidad
    const availability = allPossibleSlots.map(slotTime => {
      
      const slotDateTimeUTC = zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);

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
          startTime: slotTime,
          isAvailable: true,
          price: cheapestCourt.pricePerHour,
          courtId: cheapestCourt._id,
          courtName: cheapestCourt.name,
        };
      } else {
        return {
          startTime: slotTime,
          isAvailable: false,
          price: 0,
          courtId: null,
          courtName: null,
        };
      }
    });

    res.json(availability);

  } catch (error) {
    console.error('Error en getAggregatedAvailability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad agregada', error: error.message });
  }
};


/* --- DE AQUÍ EN ADELANTE, ES TU CÓDIGO ORIGINAL --- */
/* (Asegúrate de que estas funciones estén en tu archivo) */

// @desc    (Admin) Get all courts
// @route   GET /api/courts
// @access  Admin
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
// @route   POST /api/courts
// @access  Admin
const createCourt = async (req, res) => {
  const {
    name,
    courtType,
    pricePerHour,
    isActive,
    availableSlots, // Asegúrate de que esto se maneje
  } = req.body;

  try {
    const court = new Court({
      name,
      courtType,
      pricePerHour,
      isActive,
      availableSlots, // Asegúrate de que esto se maneje
    });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    (Admin) Get court by ID
// @route   GET /api/courts/:id
// @access  Admin
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
// @route   PUT /api/courts/:id
// @access  Admin
const updateCourt = async (req, res) => {
  const { name, courtType, pricePerHour, isActive, availableSlots } = req.body;
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      court.name = name;
      court.courtType = courtType;
      court.pricePerHour = pricePerHour;
      court.isActive = isActive;
      court.availableSlots = availableSlots;

      const updatedCourt = await court.save();
      res.json(updatedCourt);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    (Admin) Delete court
// @route   DELETE /api/courts/:id
// @access  Admin
const deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      await court.deleteOne(); // Reemplaza remove()
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
// @route   GET /api/courts/public
// @access  Public
const getPublicCourts = async (req, res) => {
  try {
    const courts = await Court.find({ isActive: true });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    (Public) Get availability for a specific court
// @route   GET /api/courts/availability/:date/:courtId
// @access  Public
const getAvailabilityForPublic = async (req, res) => {
  try {
    const { date, courtId } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';

    const court = await Court.findById(courtId);
    if (!court || !court.isActive) {
      return res.status(404).json({ message: 'Cancha no encontrada o inactiva.' });
    }

    const start = startOfDay(zonedTimeToUtc(date, timeZone));
    const end = endOfDay(zonedTimeToUtc(date, timeZone));

    const bookings = await Booking.find({
      court: courtId,
      startTime: { $gte: start, $lt: end },
      status: { $ne: 'Cancelled' },
    });

    const availability = court.availableSlots.map(slotTime => {
      const slotDateTimeUTC = zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);
      
      const isBooked = bookings.some(
        b => b.startTime.getTime() === slotDateTimeUTC.getTime()
      );
      
      return {
        startTime: slotTime,
        isAvailable: !isBooked,
      };
    });

    res.json(availability);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad' });
  }
};


module.exports = {
  getAggregatedAvailability, // La nueva función
  getCourts,
  createCourt,
  getCourtById,
  updateCourt,
  deleteCourt,
  getPublicCourts,
  getAvailabilityForPublic,
};
