// server/controllers/courtController.js
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { startOfDay, endOfDay, parseISO, getDay, addMinutes, format, addDays } = require('date-fns'); 
const { fromZonedTime } = require('date-fns-tz');
const { generateTimeSlots } = require('../utils/timeSlotGenerator'); 
const { logActivity } = require('../utils/logActivity');

// (Aquí van las 5 funciones: createCourt, getCourts, getCourtById, updateCourt, deleteCourt)
// ... (Déjalas como están) ...
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

const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    console.error('Error obteniendo canchas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

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
    const timeZone = 'America/Argentina/Buenos_Aires'; 
    const dateObj = parseISO(date); 

    // 1. Cargar configuración
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { 
      acc[setting.key] = setting.value; 
      return acc; 
    }, {});
    
    // 2. Lógica de horario por día
    const dayIndex = getDay(dateObj); 
    const dayKeys = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ];
    const dayName = dayKeys[dayIndex];

    // --- NUEVA VALIDACIÓN: Revisar si el día está abierto ---
    const isOpenKey = `${dayName}_IS_OPEN`;
    // El valor se guarda como string 'true'/'false' o puede no existir (undefined)
    const isOpen = settings[isOpenKey] === 'true'; 

    if (!isOpen) {
      console.log(`Día ${dayName} está configurado como CERRADO.`);
      return res.json({ availableSlots: [] }); // Devolver vacío si está cerrado
    }
    // --- FIN DE VALIDACIÓN ---

    const openTimeKey = `${dayName}_OPENING_HOUR`;
    const closeTimeKey = `${dayName}_CLOSING_HOUR`;

    const openTime = settings[openTimeKey];
    const closeTime = settings[closeTimeKey];
    const slotDuration = parseInt(settings.SLOT_DURATION, 10); 

    // 3. Validar configuración (solo si está abierto)
    if (!openTime || !closeTime || !slotDuration || slotDuration <= 0) {
      console.error(`❌ Validación de settings falló para ${dayName}:`, { openTime, closeTime, slotDuration });
      return res.status(400).json({
        message: `La configuración para ${dayName} (abierto) no está completa.`
      });
    }

    // 4. Generar todos los slots posibles del día
    const allPossibleSlots = generateTimeSlots(openTime, closeTime, slotDuration);

    // 5. Obtener canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('_id name pricePerHour');
    
    if (!activeCourts || activeCourts.length === 0) {
      return res.json({ availableSlots: [] });
    }
    
    // 6. Obtener reservas (de dos días, para manejar medianoche)
    const start = fromZonedTime(startOfDay(dateObj), timeZone);
    const end = fromZonedTime(endOfDay(addDays(dateObj, 1)), timeZone); 

    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end }, 
      status: { $ne: 'Cancelled' }
    }).select('court startTime endTime');

    // 7. Calcular disponibilidad (Esta lógica ya maneja la medianoche)
    let currentDay = dateObj; 
    let lastTimeStr = '00:00'; 
    
    const availability = allPossibleSlots.map(slotTime => {
      if (slotTime < lastTimeStr) {
        currentDay = addDays(dateObj, 1);
      }
      lastTimeStr = slotTime; 
      
      const slotDateStr = `${format(currentDay, 'yyyy-MM-dd')}T${slotTime}:00`;
      const slotDateTimeUTC = fromZonedTime(slotDateStr, timeZone);
      const slotEndTime = addMinutes(slotDateTimeUTC, slotDuration);
      
      const bookedCourtIds = bookings
        .filter(booking => booking.startTime < slotEndTime && booking.endTime > slotDateTimeUTC)
        .map(b => b.court.toString());

      const availableCourts = activeCourts.filter(
        court => !bookedCourtIds.includes(court._id.toString())
      );
      
      const hourMinute = slotTime.split(':');
      return {
          hour: parseInt(hourMinute[0], 10),
          minute: parseInt(hourMinute[1], 10),
          availableCourts: availableCourts.length 
        };
    });
    
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
