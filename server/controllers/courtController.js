// --- IMPORTS AÑADIDOS/VERIFICADOS ---
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { startOfDay, endOfDay, parseISO } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');
const { generateTimeSlots } = require('../utils/timeSlotGenerator'); // Asegúrate que este archivo exista en utils/
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new court
// @route   POST /api/courts
// @access  Private/Admin
const createCourt = async (req, res) => {
  try {
    const { name, courtType, pricePerHour, isActive } = req.body;
    
    // Validación básica
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
      // Opcional: Verificar si hay reservas futuras antes de borrar
      // Por ahora, borrado directo:
      await court.deleteOne(); // Usar deleteOne()
      
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

// --- FUNCIÓN getAggregatedAvailability REEMPLAZADA ---
// @desc    Get aggregated availability for a specific date
// @route   GET /api/courts/availability/:date
// @access  Public
const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params; // Asumiendo que la ruta es /availability/:date
    const timeZone = 'America/Argentina/Buenos_Aires';

    // 1. Cargar configuración
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { 
      acc[setting.key] = setting.value; 
      return acc; 
    }, {});
    
    // console.log('📋 CONFIGURACIÓN CARGADA:', settings);

    const slotDuration = parseInt(settings.slotDuration, 10);
    
    if (!settings || !settings.openTime || !settings.closeTime || !slotDuration || slotDuration <= 0) {
      console.error('❌ Validación de settings falló:', settings);
      return res.status(400).json({
        message: 'La configuración del club no está completa. Faltan Hora de Apertura, Cierre o Duración del Turno (debe ser > 0).'
      });
    }

    // 2. Generar todos los slots posibles del día
    const allPossibleSlots = generateTimeSlots(settings.openTime, settings.closeTime, slotDuration);
    // console.log(`⏰ Slots generados: ${allPossibleSlots.length} slots`);

    // 3. Obtener canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('_id name pricePerHour');
    
    if (!activeCourts || activeCourts.length === 0) {
      console.warn('⚠️ No hay canchas activas');
      // Devolver los slots como "no disponibles" en lugar de un 404
      return res.json(allPossibleSlots.map(slotTime => ({
          startTime: slotTime,
          isAvailable: false,
          price: 0,
          courtId: null,
          courtName: null,
          availableCount: 0
      })));
    }
    
    // console.log(`🏟️ Canchas activas: ${activeCourts.length}`);

    // 4. Obtener reservas del día
    const dateObj = parseISO(date);
    const start = fromZonedTime(startOfDay(dateObj), timeZone);
    const end = fromZonedTime(endOfDay(dateObj), timeZone);

    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end }, 
      status: { $ne: 'Cancelled' }
    }).select('court startTime endTime');

    // console.log(`📅 Reservas encontradas: ${bookings.length}`);

    // 5. CLAVE: Calcular disponibilidad agregada correctamente
    const availability = allPossibleSlots.map(slotTime => {
      // Convertir el slot time a UTC (usando la zona horaria)
      const slotDateTimeUTC = fromZonedTime(`${date}T${slotTime}:00`, timeZone);
      
      // Calcular el fin del slot
      const slotEndTime = new Date(slotDateTimeUTC.getTime() + slotDuration * 60000);

      // Encontrar qué canchas están ocupadas en este slot
      const bookedCourtIds = bookings
        .filter(booking => {
          // Una reserva ocupa este slot si:
          // - Empieza ANTES de que termine el slot Y termina DESPUÉS de que empiece el slot
          return booking.startTime < slotEndTime && booking.endTime > slotDateTimeUTC;
        })
        .map(b => b.court.toString());

      // console.log(`🕐 Slot ${slotTime}: ${bookedCourtIds.length} canchas ocupadas de ${activeCourts.length}`);

      // Canchas disponibles = Todas las activas - Las ocupadas
      const availableCourts = activeCourts.filter(
        court => !bookedCourtIds.includes(court._id.toString())
      );

      // Si hay AL MENOS UNA cancha disponible
      if (availableCourts.length > 0) {
        // Ordenar por precio y tomar la más barata
        availableCourts.sort((a, b) => a.pricePerHour - b.pricePerHour);
        const cheapestCourt = availableCourts[0];
        
        return {
          startTime: slotTime,
          isAvailable: true,
          price: cheapestCourt.pricePerHour, // Precio del turno (cancha más barata)
          courtId: cheapestCourt._id,
          courtName: cheapestCourt.name,
          availableCount: availableCourts.length // 👈 Útil para debug
        };
      } else {
        // Todas las canchas están ocupadas
        return {
          startTime: slotTime,
          isAvailable: false,
          price: 0,
          courtId: null,
          courtName: null,
          availableCount: 0
        };
      }
    });

    // console.log(`✅ Disponibilidad calculada: ${availability.filter(s => s.isAvailable).length} slots disponibles`);
    
    res.json(availability);
    
  } catch (error) {
    console.error('❌ Error en getAggregatedAvailability:', error);
    res.status(500).json({ 
      message: 'Error al obtener la disponibilidad agregada', 
      error: error.message 
    });
  }
};
// --- FIN DE LA FUNCIÓN REEMPLAZADA ---

module.exports = {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getAggregatedAvailability, // <-- Exportación de la función nueva/corregida
};
