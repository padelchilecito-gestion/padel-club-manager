const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting'); 
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz');

// Definimos la zona horaria del negocio
const timeZone = 'America/Argentina/Buenos_Aires';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public or Admin
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

    // (La lógica de WhatsApp sigue siendo un placeholder)
    if (createdBooking.user.phone) {
        const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva ha sido confirmada para la cancha "${court.name}" el ${start.toLocaleString()}. ¡Te esperamos!`;
        await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get availability for a court on a specific date (Legacy)
// @route   GET /api/bookings/availability
// @access  Public
const getBookingAvailability = async (req, res) => {
    const { courtId, date } = req.query;
    if (!courtId || !date) {
        return res.status(400).json({ message: 'Court ID and date are required.' });
    }

    try {
        const [year, month, day] = date.split('T')[0].split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        const bookings = await Booking.find({
            court: courtId,
            status: { $ne: 'Cancelled' },
            startTime: { $gte: startOfDay, $lte: endOfDay },
        }).select('startTime endTime');

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all bookings with pagination and filters
// @route   GET /api/bookings
// @access  Operator/Admin
const getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // --- Construir objeto de filtros ---
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
      // Convertir la fecha 'yyyy-MM-dd' a la zona horaria correcta
      const zonedDate = zonedTimeToUtc(req.query.date + 'T00:00:00', timeZone);
      const startOfDay = new Date(zonedDate);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      filters.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Por defecto, no mostramos turnos super antiguos
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      filters.startTime = { $gte: twoDaysAgo };
    }

    // Contar total de documentos con filtros
    const totalBookings = await Booking.countDocuments(filters);
    const totalPages = Math.ceil(totalBookings / limit);

    const bookings = await Booking.find(filters)
      .populate('court', 'name courtType')
      .sort({ startTime: -1 }) // Ordenar por más reciente
      .skip(skip)
      .limit(limit);

    res.json({
      bookings,
      page,
      totalPages,
      totalBookings,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a booking completely
// @route   PUT /api/bookings/:id
// @access  Operator/Admin
const updateBooking = async (req, res) => {
  try {
    const { courtId, user, startTime, endTime, price, status, isPaid, paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.court = courtId || booking.court;
    booking.user = user || booking.user;
    booking.startTime = startTime || booking.startTime;
    booking.endTime = endTime || booking.endTime;
    booking.price = price !== undefined ? price : booking.price;
    booking.status = status || booking.status;
    booking.isPaid = isPaid !== undefined ? isPaid : booking.isPaid;
    booking.paymentMethod = paymentMethod || booking.paymentMethod;

    const updatedBooking = await booking.save();

    const io = req.app.get('socketio');
    io.emit('booking_update', updatedBooking);

    const logDetails = `Booking ID ${updatedBooking._id} was updated.`;
    await logActivity(req.user, 'BOOKING_UPDATED', logDetails);

    res.json(updatedBooking);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Update booking status and payment
// @route   PUT /api/bookings/:id/status
// @access  Operator/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      booking.status = req.body.status || booking.status;
      booking.isPaid = req.body.isPaid !== undefined ? req.body.isPaid : booking.isPaid;
      booking.paymentMethod = req.body.paymentMethod || booking.paymentMethod;
      
      const updatedBooking = await booking.save();
      
      const io = req.app.get('socketio');
      io.emit('booking_update', updatedBooking);
      
      const logDetails = `Booking ID ${updatedBooking._id} status changed to '${updatedBooking.status}'.`;
      await logActivity(req.user, 'BOOKING_UPDATED', logDetails);

      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Operator/Admin
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();

            const io = req.app.get('socketio');
            io.emit('booking_update', updatedBooking); 
            
            const logDetails = `Booking ID ${updatedBooking._id} was cancelled.`;
            await logActivity(req.user, 'BOOKING_CANCELLED', logDetails);

            res.json({ message: 'Booking cancelled successfully' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ---
// --- NUEVAS FUNCIONES DE API PÚBLICA (CON CORRECCIÓN DE IMPORT) ---
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

        const businessHours = settings ? JSON.parse(settings.value) : createDefaultSchedule();
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

/**
 * @desc    Get available courts and prices for a selected time range
 * @route   GET /api/bookings/public-options
 * @access  Public
 */
const getPublicCourtOptions = async (req, res) => {
    const { startTime, endTime } = req.query;
    if (!startTime || !endTime) {
        return res.status(400).json({ message: 'Start time and end time are required.' });
    }

    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationHours = (end - start) / (1000 * 60 * 60);

        if (durationHours <= 0) {
            return res.status(400).json({ message: 'Invalid time range.' });
        }

        const conflictingBookings = await Booking.find({
            status: { $ne: 'Cancelled' },
            $or: [
                { startTime: { $lt: end, $gte: start } },
                { endTime: { $gt: start, $lte: end } },
                { startTime: { $lte: start }, endTime: { $gte: end } }
            ],
        }).select('court');
        
        const bookedCourtIds = conflictingBookings.map(b => b.court.toString());
        const uniqueBookedCourtIds = [...new Set(bookedCourtIds)];

        const availableCourts = await Court.find({
            isActive: true,
            _id: { $nin: uniqueBookedCourtIds }
        }).select('name courtType pricePerHour');

        const options = availableCourts.map(court => ({
            id: court._id,
            name: court.name,
            type: court.courtType,
            price: court.pricePerHour * durationHours
        }));

        res.json(options);

    } catch (error) {
        console.error('Error fetching court options:', error);
        res.status(500).json({ message: 'Server Error' });
    }
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
};
