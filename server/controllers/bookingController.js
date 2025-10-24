const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
const { zonedTimeToUtc, startOfDay, endOfDay, addMinutes }_ = require('date-fns-tz');

// @desc    Create a new booking (MODIFICADO para Puntos 3, 4, 5)
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
  // Ahora recibimos 'user' (con name, phone) y 'slots' (array)
  const { slots, user, paymentMethod } = req.body;

  if (!slots || slots.length === 0 || !user || !paymentMethod) {
    return res.status(400).json({ message: 'Faltan datos para la reserva.' });
  }

  try {
    // Usamos el primer slot para los detalles principales
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const timeZone = 'America/Argentina/Buenos_Aires';

    const court = await Court.findById(firstSlot.courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Calcular startTime (del primer slot) y endTime (del último slot + duración)
    const startTime = zonedTimeToUtc(`${firstSlot.date}T${firstSlot.startTime}`, timeZone);
    
    // Asumimos que la duración es de 30 min por slot (debería venir de settings)
    const slotDuration = 30; 
    const endTime = addMinutes(
      zonedTimeToUtc(`${lastSlot.date}T${lastSlot.startTime}`, timeZone),
      slotDuration
    );

    if (startTime >= endTime) {
      return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      court: firstSlot.courtId,
      status: { $ne: 'Cancelled' },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({ message: 'Uno o más de los turnos seleccionados ya fueron reservados.' });
    }
    
    // Calcular precio total (Punto 5)
    const totalPrice = slots.reduce((total, slot) => total + slot.price, 0);

    const booking = new Booking({
      court: firstSlot.courtId,
      // Guardar datos del cliente (Punto 3)
      user: {
        name: user.name,
        lastName: user.lastName,
        phone: user.phone,
        // (Si el usuario está logueado, podríamos añadir req.user._id)
      },
      startTime: startTime,
      endTime: endTime,
      price: totalPrice,
      paymentMethod: paymentMethod, // (Punto 4)
      isPaid: paymentMethod === 'MercadoPago', // Asumir pagado si es MP, pendiente si es Efectivo
      status: 'Confirmed',
    });

    const createdBooking = await booking.save();
    
    const io = req.app.get('socketio');
    io.emit('booking_update', createdBooking);
    
    // (req.user no existe en una ruta pública, loguear anónimamente o quitarlo)
    // await logActivity(req.user, 'BOOKING_CREATED', logDetails);

    if (createdBooking.user.phone) {
        const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en Padel Club Manager para la cancha "${court.name}" el ${startTime.toLocaleString(timeZone)} ha sido confirmada. Total: $${totalPrice}. ¡Te esperamos!`;
        // await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('Error en createBooking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// (El resto de funciones: getBookingAvailability, getBookings, etc. siguen igual)
// ...

module.exports = {
  createBooking,
  // ... (exporta el resto de tus funciones)
};
