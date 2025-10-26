const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
// --- CORRECCIÓN DE IMPORTACIÓN ---
const { startOfDay, endOfDay, parseISO, addMinutes } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');
// --- FIN DE CORRECCIÓN ---

const createBooking = async (req, res) => {
  const { slots, user, paymentMethod } = req.body;
  // ... validaciones ...
  try {
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const timeZone = 'America/Argentina/Buenos_Aires';
    const court = await Court.findById(firstSlot.courtId);
    if (!court) return res.status(404).json({ message: 'Court not found' });

    // --- CORRECCIÓN DE USO ---
    const startTime = zonedTimeToUtc(`${firstSlot.date}T${firstSlot.startTime}`, timeZone);
    // TODO: Usar settings.slotDuration real
    const settingsList = await require('../models/Setting').find({}); 
    const settings = settingsList.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {});
    const slotDuration = parseInt(settings.slotDuration, 10) || 30; // Usar de settings o default 30
    
    // Necesitamos 'parse' de date-fns para convertir HH:mm a Date
    const { parse } = require('date-fns'); 
    const baseDateForCalc = '1970-01-01'; // Fecha base para cálculos de tiempo
    const lastSlotTimeAsDate = parse(`${baseDateForCalc}T${lastSlot.startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
    const endTimeFromLastSlot = addMinutes(lastSlotTimeAsDate, slotDuration);

    // Convertir la hora de fin calculada a UTC en la fecha correcta
    const endTime = zonedTimeToUtc(`${lastSlot.date}T${endTimeFromLastSlot.getHours().toString().padStart(2,'0')}:${endTimeFromLastSlot.getMinutes().toString().padStart(2,'0')}`, timeZone);
    // --- FIN DE CORRECCIÓN ---

    if (startTime >= endTime) return res.status(400).json({ /* ... */ });
    const conflictingBooking = await Booking.findOne({ /* ... */ });
    if (conflictingBooking) return res.status(409).json({ /* ... */ });
    
    const totalPrice = slots.reduce((total, slot) => total + slot.price, 0);
    const booking = new Booking({ /* ... datos ... */ });
    const createdBooking = await booking.save();
    req.app.get('socketio').emit('booking_update', createdBooking);
    // ... log, notification ...
    res.status(201).json(createdBooking);
  } catch (error) { 
     console.error('Error en createBooking:', error);
     res.status(500).json({ message: 'Server Error' });
  }
};

/* --- CÓDIGO ORIGINAL (con corrección de uso) --- */
const getBookingAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'La fecha es requerida' });
        const timeZone = 'America/Argentina/Buenos_Aires';
        // --- CORRECCIÓN DE LÓGICA ---
        const dateObj = parseISO(date);
        const start = zonedTimeToUtc(startOfDay(dateObj), timeZone);
        const end = zonedTimeToUtc(endOfDay(dateObj), timeZone);
        // --- FIN DE CORRECCIÓN ---
        const bookings = await Booking.find({ startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } }).populate('court');
        res.status(200).json(bookings);
    } catch (error) { 
        console.error("Error en getBookingAvailability:", error);
        res.status(500).json({ message: 'Error interno al obtener disponibilidad.', error: error.message });
    }
};

const getBookings = async (req, res) => { /* ... */ };
const getBookingById = async (req, res) => { /* ... */ };
const updateBookingStatus = async (req, res) => { /* ... */ };
const cancelBooking = async (req, res) => { /* ... */ };

module.exports = {
  createBooking, getBookings, getBookingById, updateBookingStatus,
  cancelBooking, getBookingAvailability,
};
