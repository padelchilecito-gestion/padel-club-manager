const mongoose = require('mongoose'); // <-- Asegúrate de que Mongoose esté importado
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting'); 
const { logActivity } = require('../utils/logActivity');
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz');

// Definimos la zona horaria del negocio
const timeZone = 'America/Argentina/Buenos_Aires';

// --- createBooking (sin cambios) ---
const createBooking = async (req, res) => {
  const { courtId, user, startTime, endTime, paymentMethod, isPaid, price } = req.body;

  try {
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const conflictingBooking = await Booking.findOne({
      court: courtId,
      status: { $ne: 'Cancelled' },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({ message: 'The selected time slot is already booked.' });
    }
    
    let finalPrice = price; 
    if (finalPrice === undefined && req.body.totalPrice !== undefined) {
        finalPrice = req.body.totalPrice;
    }

    if (finalPrice === undefined) {
      const durationHours = (end - start) / (1000 * 60 * 60);
      finalPrice = durationHours * court.pricePerHour;
    }

    const booking = new Booking({
      court: courtId,
      user,
      startTime: start,
      endTime: end,
      price: finalPrice,
      paymentMethod,
      isPaid: isPaid || false,
      status: 'Confirmed',
    });

    const createdBooking = await booking.save();
    
    const io = req.app.get('socketio');
    io.emit('booking_update', createdBooking);
    
    if (req.user) {
        const logDetails = `Booking created for ${createdBooking.user.name} on court '${court.name}' from ${start.toLocaleString()} to ${end.toLocaleString()}.`;
        await logActivity(req.user, 'BOOKING_CREATED', logDetails);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// --- getBookingAvailability (sin cambios) ---
const getBookingAvailability = async (req, res) => {
    // ... (código existente) ...
};

// --- getBookings (sin cambios) ---
// (Esta función fallaba por tus DATOS, no por el código. Arregla "MCristal" y funcionará)
const getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const filters = {};

    if (req.query.name) {
      filters['user.name'] = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.court && req.query.court !== 'all') {
      filters.court = req.query.court;
    }
    if (req.query.payment && req.query.payment !== 'all') {
      filters.isPaid = req.query.payment === 'paid';
    }
    if (req.query.date) {
      const zonedDate = zonedTimeToUtc(req.query.date + 'T00:00:00', timeZone);
      const startOfDay = new Date(zonedDate);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      filters.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      filters.startTime = { $gte: twoDaysAgo };
    }

    const totalBookings = await Booking.countDocuments(filters);
    const totalPages = Math.ceil(totalBookings / limit);

    const bookings = await Booking.find(filters)
      .populate('court', 'name courtType')
      .sort({ startTime: -1 }) 
      .skip(skip)
      .limit(limit);

    res.json({
      bookings,
      page,
      totalPages,
      totalBookings,
    });
    
  } catch (error) {
    console.error(error); // El error "MCristal" debería aparecer aquí en tus logs de Render
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- updateBooking (sin cambios) ---
const updateBooking = async (req, res) => {
    // ... (código existente) ...
};

// --- updateBookingStatus (sin cambios) ---
const updateBookingStatus = async (req, res) => {
    // ... (código existente) ...
};

// --- cancelBooking (sin cambios) ---
const cancelBooking = async (req, res) => {
    // ... (código existente) ...
};

// ---
// --- FUNCIONES PÚBLICAS (AQUÍ ESTÁ LA CORRECCIÓN) ---
// ---

// Helper para crear un horario por defecto (todo cerrado)
const createDefaultSchedule = () => {
    const schedule = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = Array(48).fill(false);
    }
    return schedule;
};

/**
 * @desc    Get all available 30-min slots for a given date
 * @route   GET /api/bookings/public-slots
 * @access  Public
 */
const getPublicAvailabilitySlots = async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Date is required.' });
    }

    try {
        const settingsPromise = Setting.findOne({ key: 'BUSINESS_HOURS' });
        const courtsPromise = Court.find({ isActive: true }).select('_id');
        
        const startOfDayArg = zonedTimeToUtc(date + 'T00:00:00', timeZone);
        
        const endOfWindow = new Date(startOfDayArg.getTime() + 36 * 60 * 60 * 1000); 
        const now = new Date(); // 'now' sigue siendo UTC

        const bookingsPromise = Booking.find({
            status: { $ne: 'Cancelled' },
            startTime: { $gte: startOfDayArg, $lt: endOfWindow }
        }).select('court startTime endTime');

        const [settings, activeCourts, bookings] = await Promise.all([
            settingsPromise,
            courtsPromise,
            bookingsPromise
        ]);

        // --- LÓGICA DE BUSINESS_HOURS CORREGIDA ---
        let businessHours;
        try {
          // Intentamos parsear. Si 'settings' es null o 'settings.value' está corrupto, irá al catch.
          businessHours = settings ? JSON.parse(settings.value) : createDefaultSchedule();
        } catch (e) {
          console.error("Error parseando BUSINESS_HOURS, usando horario por defecto (cerrado).", e.message);
          businessHours = createDefaultSchedule();
        }
        // ------------------------------------------

        const courtIds = activeCourts.map(c => c._id.toString());
        const totalActiveCourts = activeCourts.length;

        if (totalActiveCourts === 0) {
            return res.json([]);
        }
        
        const bookingMap = {}; 
        for (const booking of bookings) {
            let current = new Date(booking.startTime);
            while (current < booking.endTime) {
                const iso = current.toISOString();
                if (!bookingMap[iso]) bookingMap[iso] = [];
                bookingMap[iso].push(booking.court.toString());
                current.setMinutes(current.getMinutes() + 30);
            }
        }

        const availableSlots = [];
        let currentSlotTime = new Date(startOfDayArg); // Empezamos en 00:00 ARGT
        const totalSlotsInWindow = (36 * 60) / 30; // 72 slots

        for (let i = 0; i < totalSlotsInWindow; i++) {
            const slotEnd = new Date(currentSlotTime.getTime() + 30 * 60 * 1000);

            if (slotEnd < now) {
                currentSlotTime = slotEnd;
                continue;
            }
            
            const localSlotTime = utcToZonedTime(currentSlotTime, timeZone);
            
            const dayIndex = localSlotTime.getDay(); // 0 = Domingo (AR), 1 = Lunes (AR)...
            const slotIndex = (localSlotTime.getHours() * 2) + (localSlotTime.getMinutes() / 30);
            
            if (!businessHours[dayIndex] || !businessHours[dayIndex][slotIndex]) {
                currentSlotTime = slotEnd;
                continue;
            }

            const bookedCourtsForSlot = bookingMap[currentSlotTime.toISOString()] || [];
            const availableCourtCount = totalActiveCourts - bookedCourtsForSlot.length;

            if (availableCourtCount > 0) {
                availableSlots.push(currentSlotTime.toISOString());
            }

            currentSlotTime = slotEnd;
        }

        res.json(availableSlots);

    } catch (error) {
        console.error('Error fetching public slots:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- getPublicCourtOptions (sin cambios) ---
const getPublicCourtOptions = async (req, res) => {
    // ... (código existente) ...
};

// --- createRecurringBooking (sin cambios) ---
const createRecurringBooking = async (req, res) => {
    // ... (código existente) ...
};

// --- deleteRecurringBooking (sin cambios) ---
const deleteRecurringBooking = async (req, res) => {
    // ... (código existente) ...
};


module.exports = {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
  getPublicAvailabilitySlots,
  getPublicCourtOptions,
  createRecurringBooking,
  deleteRecurringBooking,
};
