const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { startOfDay, endOfDay, parseISO } = require('date-fns');

// @desc    Create a court
// @route   POST /api/courts
// @access  Admin
const createCourt = async (req, res) => {
  const { name, type, price, availableSlots, status } = req.body;
  try {
    const court = new Court({
      name,
      type,
      price,
      availableSlots,
      status,
    });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all courts (admin view)
// @route   GET /api/courts
// @access  Admin
const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get court by ID
// @route   GET /api/courts/:id
// @access  Admin
const getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      res.json(court);
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Admin
const updateCourt = async (req, res) => {
  const { name, type, price, availableSlots, status } = req.body;
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      court.name = name;
      court.type = type;
      court.price = price;
      court.availableSlots = availableSlots;
      court.status = status;
      const updatedCourt = await court.save();
      res.json(updatedCourt);
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a court
// @route   DELETE /api/courts/:id
// @access  Admin
const deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      await court.deleteOne();
      res.json({ message: 'Cancha eliminada' });
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all active courts for public view
// @route   GET /api/courts/public
// @access  Public
const getPublicCourts = async (req, res) => {
  try {
    const courts = await Court.find({ status: 'available' }).select(
      'name type price availableSlots'
    );
    res.json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get court availability for a specific date
// @route   GET /api/courts/availability/:date/:courtId
// @access  Public
const getAvailabilityForPublic = async (req, res) => {
  try {
    // --- LÍNEA CORREGIDA ---
    // Cambiamos req.query (ej: ?date=...) por req.params (ej: /:date/)
    const { date, courtId } = req.params;
    // --- FIN DE CORRECCIÓN ---

    const targetDate = parseISO(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // 1. Encontrar la cancha
    const court = await Court.findById(courtId);
    if (!court || court.status !== 'available') {
      return res.status(404).json({ message: 'Cancha no disponible.' });
    }

    // 2. Encontrar reservas (Bookings) para esa cancha en ese día
    const bookings = await Booking.find({
      court: courtId,
      startTime: {
        $gte: dayStart,
        $lte: dayEnd,
      },
      status: { $in: ['confirmed', 'paid', 'pending'] }, // Estados que ocupan el slot
    });

    // 3. Crear la lista de disponibilidad
    const bookedStartTimes = bookings.map(b => format(b.startTime, 'HH:mm'));
    
    const availability = court.availableSlots.map(slotTime => {
      const isBooked = bookedStartTimes.includes(slotTime);
      return {
        startTime: slotTime,
        isAvailable: !isBooked,
      };
    });

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad.', error: error.message });
  }
};


module.exports = {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getPublicCourts,
  getAvailabilityForPublic,
};
