// server/controllers/courtController.js
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { startOfDay, endOfDay, parseISO, getDay } = require('date-fns'); // Importar getDay
const { fromZonedTime } = require('date-fns-tz');
const { generateTimeSlots } = require('../utils/timeSlotGenerator'); 
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new court
// @route   POST /api/courts
// @access  Private/Admin
const createCourt = async (req, res) => {
  try {
    const { name, courtType, pricePerHour, isActive } = req.body;
    
    if (!name || !courtType || !pricePerHour) {
        return res.status(400).json({ message: 'Nombre, tipo y precio son requeridos.' });
    }
    
    const court = new Court({
      name,
      courtType,
      pricePerHour,
      isActive: isActive !== undefined ? isActive : true
    });

    const createdCourt = await court.save();
    await logActivity('Court', createdCourt._id, 'create', req.user ? req.user.id : 'System', { name });
    res.status(201).json(createdCourt);
  } catch (error) {
    console.error('Error creando cancha:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// @desc    Get all courts
// @route   GET /api/courts
// @access  Private/Admin
const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    console.error('Error obteniendo canchas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// @desc    Get court by ID
// @route   GET /api/courts/:id
// @access  Private/Admin
const getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);

    if (court) {
      res.json(court);
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo cancha por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Private/Admin
const updateCourt = async (req, res) => {
  try {
    const { name, courtType, pricePerHour, isActive } = req.body;
    const court = await Court.findById(req.params.id);

    if (court) {
      court.name = name || court.name;
      court.courtType = courtType || court.courtType;
      court.pricePerHour = pricePerHour !== undefined ? pricePerHour : court.pricePerHour;
      court.isActive = isActive !== undefined ? isActive : court.isActive;

      const updatedCourt = await court.save();
      await logActivity('Court', updatedCourt._id, 'update', req.user ? req.user.id : 'System', { name: updatedCourt.name });
      res.json(updatedCourt);
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    console.error('Error actualizando cancha:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// @desc    Delete a court
// @route   DELETE /api/courts/:id
// @access  Private/Admin
const deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);

    if (court) {
      await court.deleteOne(); 
      await logActivity('Court', req.params.id, 'delete', req.user ? req.user.id : 'System', { name: court.name });
      res.json({ message: 'Cancha eliminada' });
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    console.error('Error eliminando cancha:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// --- FUNCIÓN getAggregatedAvailability CORREGIDA ---
// @desc    Get aggregated availability for a specific date
// @route   GET /api/courts/availability/:date
// @access  Public
const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params; 
    const timeZone = 'America/Argentina/Buenos_Aires'; // Asegúrate que esta sea tu zona horaria
    const dateObj = parseISO(date); // La fecha que llega del frontend

    // 1. Cargar configuración
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { 
      acc[setting.key] = setting.value; 
      return acc; 
    }, {});
    
    // --- LÓGICA DE HORARIO CORREGIDA ---
    // Determinar si es fin de semana (0 = Domingo, 6 = Sábado)
    const dayOfWeek = getDay(dateObj); 
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // Seleccionar las claves correctas
    const openTimeKey = isWeekend ? 'WEEKEND_OPENING_HOUR' : 'WEEKDAY_OPENING_HOUR';
    const closeTimeKey = isWeekend ? 'WEEKEND_CLOSING_HOUR' : 'WEEKDAY_CLOSING_HOUR';

    // Obtener los valores correctos
    const openTime = settings[openTimeKey];
    const closeTime = settings[closeTimeKey];
    const slotDuration = parseInt(settings.SLOT_DURATION, 10); // Usar la clave correcta

    // 2. Validar configuración
    if (!openTime || !closeTime || !slotDuration || slotDuration <= 0) {
      console.error('❌ Validación de settings falló:', { openTime, closeTime, slotDuration });
      return res.status(400).json({
        message: 'La configuración del club no está completa. Faltan horas de apertura/cierre o duración del turno.'
      });
    }

    // 3. Generar todos los slots posibles del día
    const allPossibleSlots = generateTimeSlots(openTime, closeTime, slotDuration);

    // 4. Obtener canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('_id name pricePerHour');
    
    if (!activeCourts || activeCourts.length === 0) {
      return res.json({ availableSlots: [] }); // Devolver array vacío si no hay canchas
    }
    
    // 5. Obtener reservas del día
    const start = fromZonedTime(startOfDay(dateObj), timeZone);
    const end = fromZonedTime(endOfDay(dateObj), timeZone);

    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end }, 
      status: { $ne: 'Cancelled' }
    }).select('court startTime endTime');

    // 6. Calcular disponibilidad agregada
    const availability = allPossibleSlots.map(slotTime => {
      // (slotTime es un string "HH:mm")
      // Convertir el slot "HH:mm" a un objeto Date completo en la zona horaria correcta
      const slotDateStr = `${format(dateObj, 'yyyy-MM-dd')}T${slotTime}:00`;
      const slotDateTimeUTC = fromZonedTime(slotDateStr, timeZone);
      
      // Calcular el fin del slot
      const slotEndTime = addMinutes(slotDateTimeUTC, slotDuration);

      // Encontrar qué canchas están ocupadas en este slot
      const bookedCourtIds = bookings
        .filter(booking => {
          // Un slot está ocupado si una reserva empieza antes de que TERMINE el slot
          // Y termina después de que EMPIECE el slot.
          return booking.startTime < slotEndTime && booking.endTime > slotDateTimeUTC;
        })
        .map(b => b.court.toString());

      // Canchas disponibles = Todas las activas - Las ocupadas
      const availableCourts = activeCourts.filter(
        court => !bookedCourtIds.includes(court._id.toString())
      );
      
      const hourMinute = slotTime.split(':');
      return {
          hour: parseInt(hourMinute[0], 10),
          minute: parseInt(hourMinute[1], 10),
          availableCourts: availableCourts.length // Cuántas canchas quedan libres
        };
    });
    
    // Devolver solo los slots que tienen al menos 1 cancha disponible
    // const availableSlots = availability.filter(slot => slot.availableCourts > 0);
    // No, devolvemos todos y el frontend los pinta
    
    res.json({ availableSlots: availability });
    
  } catch (error) {
    console.error('❌ Error en getAggregatedAvailability:', error);
    res.status(500).json({ 
      message: 'Error al obtener la disponibilidad agregada', 
      error: error.message 
    });
  }
};
// --- FIN DE LA FUNCIÓN CORREGIDA ---

module.exports = {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getAggregatedAvailability, 
};
