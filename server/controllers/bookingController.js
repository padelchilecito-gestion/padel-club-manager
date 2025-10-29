// server/controllers/bookingController.js
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting');
const { parseISO, addMinutes, isAfter, isBefore } = require('date-fns');
const { fromZonedTime, toZonedTime } = require('date-fns-tz');
const { logActivity } = require('../utils/logActivity');
const mercadopago = require('mercadopago'); // Ya lo tienes configurado, solo lo importamos

// Importar tu configuración de Mercado Pago
require('../config/mercadopago-Config'); // Esto cargará la configuración de MP


// Helper para encontrar una cancha disponible (lógica simplificada)
const findAvailableCourt = async (startTime, endTime, existingBookings, courtType = 'Padel') => {
  const activeCourts = await Court.find({ isActive: true, courtType: courtType }); 

  for (const court of activeCourts) {
    const isCourtBooked = existingBookings.some(booking =>
      booking.court.toString() === court._id.toString() &&
      isBefore(booking.startTime, endTime) &&
      isAfter(booking.endTime, startTime)
    );
    if (!isCourtBooked) {
      return court._id; 
    }
  }
  return null; 
};

// @desc    Create new booking (función genérica, revisar si se fusiona o mantiene)
// @route   POST /api/bookings
// @access  Private/Client (si requiere login)
const createBooking = asyncHandler(async (req, res) => {
  // Esta es tu función createBooking existente.
  // Podrías adaptarla para que si el usuario está logueado, sea la que se use,
  // y luego llamar a createBookingCash o createBookingMercadoPago internamente,
  // O simplemente estas dos nuevas funciones reemplazan a esta para el frontend público.
  // Por ahora, la dejamos como está si ya existe.
  res.status(501).json({ message: "La ruta /api/bookings POST genérica aún no está implementada para el frontend público." });
});


// @desc    Create new booking with cash payment
// @route   POST /api/bookings/cash
// @access  Public
const createBookingCash = asyncHandler(async (req, res) => {
  const { 
    courtId, 
    startTime, 
    duration, 
    clientName, 
    clientLastName, 
    clientPhone, 
    price, 
    userId // Será undefined si no está logueado
  } = req.body;

  // Validaciones básicas
  if (!startTime || !duration || !clientName || !clientPhone || !price) {
    res.status(400);
    throw new Error('Faltan datos obligatorios para la reserva.');
  }

  const timeZone = process.env.TZ || 'America/Argentina/Buenos_Aires'; // Usar TZ de env o default

  const bookingStartTime = fromZonedTime(parseISO(startTime), timeZone);
  const bookingEndTime = addMinutes(bookingStartTime, duration);

  // 1. Obtener todas las reservas existentes que solapan para el rango de tiempo
  const overlappingBookings = await Booking.find({
    startTime: { $lt: bookingEndTime },
    endTime: { $gt: bookingStartTime },
    status: { $ne: 'Cancelled' }
  });

  // 2. Encontrar una cancha disponible (si courtId no se especificó)
  let finalCourtId = courtId;
  if (!finalCourtId) {
    finalCourtId = await findAvailableCourt(bookingStartTime, bookingEndTime, overlappingBookings);
    if (!finalCourtId) {
      res.status(409); // Conflict
      throw new Error('No hay canchas disponibles para la hora seleccionada.');
    }
  } else {
    // Si se especificó courtId, verificar que esa cancha esté realmente disponible
    const isSpecifiedCourtBooked = overlappingBookings.some(booking =>
      booking.court.toString() === finalCourtId.toString() &&
      isBefore(booking.startTime, bookingEndTime) &&
      isAfter(booking.endTime, bookingStartTime)
    );
    if (isSpecifiedCourtBooked) {
      res.status(409);
      throw new Error('La cancha seleccionada ya está reservada para ese horario.');
    }
  }

  // 3. Crear la reserva
  const booking = await Booking.create({
    user: userId, // Puede ser null si el usuario no está logueado
    court: finalCourtId,
    startTime: bookingStartTime,
    endTime: bookingEndTime,
    clientName,
    clientLastName,
    clientPhone,
    paymentMethod: 'Cash',
    price: price,
    status: 'Pending', // O 'Confirmed' si el efectivo se considera inmediato
  });

  if (booking) {
    await logActivity('Booking', booking._id, 'create_cash', req.user ? req.user._id : null, { clientName, startTime });
    res.status(201).json(booking);
  } else {
    res.status(400);
    throw new Error('No se pudo crear la reserva en efectivo.');
  }
});


// @desc    Create new booking with Mercado Pago
// @route   POST /api/bookings/mercadopago
// @access  Public
const createBookingMercadoPago = asyncHandler(async (req, res) => {
  const { 
    courtId, 
    startTime, 
    duration, 
    clientName, 
    clientLastName, 
    clientPhone, 
    price, 
    userId 
  } = req.body;

  if (!startTime || !duration || !clientName || !clientPhone || !price) {
    res.status(400);
    throw new Error('Faltan datos obligatorios para la reserva.');
  }

  const timeZone = process.env.TZ || 'America/Argentina/Buenos_Aires';
  const bookingStartTime = fromZonedTime(parseISO(startTime), timeZone);
  const bookingEndTime = addMinutes(bookingStartTime, duration);

  const overlappingBookings = await Booking.find({
    startTime: { $lt: bookingEndTime },
    endTime: { $gt: bookingStartTime },
    status: { $ne: 'Cancelled' }
  });

  let finalCourtId = courtId;
  if (!finalCourtId) {
    finalCourtId = await findAvailableCourt(bookingStartTime, bookingEndTime, overlappingBookings);
    if (!finalCourtId) {
      res.status(409);
      throw new Error('No hay canchas disponibles para la hora seleccionada.');
    }
  } else {
    const isSpecifiedCourtBooked = overlappingBookings.some(booking =>
      booking.court.toString() === finalCourtId.toString() &&
      isBefore(booking.startTime, bookingEndTime) &&
      isAfter(booking.endTime, bookingStartTime)
    );
    if (isSpecifiedCourtBooked) {
      res.status(409);
      throw new Error('La cancha seleccionada ya está reservada para ese horario.');
    }
  }

  // Crear la reserva primero con estado 'AwaitingPayment'
  const newBooking = await Booking.create({
    user: userId,
    court: finalCourtId,
    startTime: bookingStartTime,
    endTime: bookingEndTime,
    clientName,
    clientLastName,
    clientPhone,
    paymentMethod: 'MercadoPago',
    price: price,
    status: 'AwaitingPayment', // Estado para indicar que espera pago
  });

  if (!newBooking) {
    res.status(400);
    throw new Error('No se pudo iniciar la reserva de Mercado Pago.');
  }

  // --- Lógica de Mercado Pago ---
  const preference = {
    items: [
      {
        title: `Reserva de Pádel - ${clientName} ${clientLastName || ''}`,
        unit_price: parseFloat(price.toFixed(2)),
        quantity: 1,
        currency_id: 'ARS', 
      },
    ],
    // URL de retorno si el pago es exitoso
    back_urls: {
      success: `${process.env.FRONTEND_URL}/payment/success?bookingId=${newBooking._id.toString()}`,
      failure: `${process.env.FRONTEND_URL}/payment/failure?bookingId=${newBooking._id.toString()}`,
      pending: `${process.env.FRONTEND_URL}/payment/pending?bookingId=${newBooking._id.toString()}`,
    },
    auto_return: 'approved',
    // Notification URL (Webhook) para que Mercado Pago nos notifique del estado del pago
    notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
    external_reference: newBooking._id.toString(), // Para identificar la reserva
  };

  try {
    const responseMp = await mercadopago.preferences.create(preference);
    await logActivity('Booking', newBooking._id, 'init_mercadopago', req.user ? req.user._id : null, { preferenceId: responseMp.body.id });
    res.json({ init_point: responseMp.body.init_point }); // Devolvemos la URL de redirección
  } catch (mpError) {
    console.error('Error al crear preferencia de Mercado Pago:', mpError);
    // Si falla MP, cancelamos la reserva creada para evitar inconsistencias
    await Booking.findByIdAndDelete(newBooking._id); 
    res.status(500);
    throw new Error('Error al conectar con Mercado Pago. Intenta nuevamente.');
  }
});


// (getBookings, getBookingById, updateBooking, deleteBooking ... sin cambios en la lógica principal)
// Estas funciones ya deberían estar en tu controlador y no necesitan cambios adicionales
const getBookings = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'Client') {
    filter.user = req.user._id;
  }
  const bookings = await Booking.find(filter).populate('user', 'name email').populate('court', 'name');
  res.json(bookings);
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('court', 'name');
  
  if (!booking) {
    res.status(404);
    throw new Error('Reserva no encontrada');
  }

  if (req.user.role === 'Client' && booking.user && booking.user.toString() !== req.user._id.toString()) {
    res.status(403); 
    throw new Error('No tienes permiso para ver esta reserva.');
  }

  res.json(booking);
});

const updateBooking = asyncHandler(async (req, res) => {
  const { status, paymentStatus, notes } = req.body; 
  const booking = await Booking.findById(req.params.id);

  if (booking) {
    booking.status = status || booking.status;
    booking.notes = notes || booking.notes;

    const updatedBooking = await booking.save();
    await logActivity('Booking', updatedBooking._id, 'update', req.user._id, { status: updatedBooking.status });
    res.json(updatedBooking);
  } else {
    res.status(404);
    throw new Error('Reserva no encontrada');
  }
});

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (booking) {
    await booking.deleteOne();
    await logActivity('Booking', req.params.id, 'delete', req.user._id, { id: req.params.id });
    res.json({ message: 'Reserva eliminada' });
  } else {
    res.status(404);
    throw new Error('Reserva no encontrada');
  }
});

module.exports = {
  createBooking, // Mantener si la tienes para otros usos
  createBookingCash,
  createBookingMercadoPago,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
