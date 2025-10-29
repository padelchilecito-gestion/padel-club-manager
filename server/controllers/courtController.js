// server/controllers/courtController.js
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { startOfDay, endOfDay, parseISO, getDay, addMinutes, format, addDays, isBefore } = require('date-fns'); 
const { fromZonedTime } = require('date-fns-tz');
const { generateTimeSlots } = require('../utils/timeSlotGenerator'); 
const { logActivity } = require('../utils/logActivity');

// (createCourt, getCourts, getCourtById, updateCourt, deleteCourt ... sin cambios)
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


const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params; 
    const timeZone = 'America/Argentina/Buenos_Aires'; 
    const dateObj = parseISO(date); // Fecha seleccionada por el usuario

    // 1. Cargar configuración
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { 
      acc[setting.key] = setting.value; 
      return acc; 
    }, {});
    
    // 2. Lógica de horario por día
    const dayIndex = getDay(dateObj); 
    const dayKeys = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayKeys[dayIndex];

    const isOpenKey = `${dayName}_IS_OPEN`;
    const isOpen = settings[isOpenKey] === 'true'; 

    if (!isOpen) {
      return res.json({ availableSlots: [] }); // Club cerrado ese día
    }

    const openTimeKey = `${dayName}_OPENING_HOUR`;
    const closeTimeKey = `${dayName}_CLOSING_HOUR`;
    const openTime = settings[openTimeKey];
    const closeTime = settings[closeTimeKey];
    const slotDuration = parseInt(settings.SLOT_DURATION, 10); 

    // 3. Validar configuración
    if (!openTime || !closeTime || !slotDuration || slotDuration <= 0) {
      console.error(`Configuración incompleta para ${dayName}:`, { openTime, closeTime, slotDuration });
      return res.status(400).json({ message: `Configuración incompleta para ${dayName}.` });
    }

    // 4. Generar todos los slots posibles del día
    // Esto es crucial: generateTimeSlots debe manejar correctamente horarios que cruzan la medianoche
    const allPossibleSlots = generateTimeSlots(openTime, closeTime, slotDuration);

    // 5. Obtener canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('_id');
    if (!activeCourts || activeCourts.length === 0) {
      return res.json({ availableSlots: [] });
    }
    const totalActiveCourts = activeCourts.length;
    
    // 6. Obtener reservas
    // Para manejar turnos que cruzan la medianoche, obtenemos reservas desde el inicio del día
    // hasta el final del día siguiente.
    const startOfTargetDate = fromZonedTime(startOfDay(dateObj), timeZone);
    const endOfNextDay = fromZonedTime(endOfDay(addDays(dateObj, 1)), timeZone); // Incluye el día siguiente

    const bookings = await Booking.find({
      startTime: { $gte: startOfTargetDate, $lt: endOfNextDay }, 
      status: { $ne: 'Cancelled' } // Ignorar reservas canceladas
    }).select('court startTime endTime');
    
    const activeCourtIds = new Set(activeCourts.map(c => c._id.toString()));

    // 7. Calcular disponibilidad agregada
    let currentDayIterator = dateObj; // Usaremos esto para ajustar el día si el slot cruza medianoche
    let previousSlotTime = '00:00'; // Para detectar el cruce de medianoche

    const availability = allPossibleSlots.map(slotTime => {
        // Si el tiempo actual del slot es menor que el anterior, significa que hemos cruzado la medianoche
        if (slotTime < previousSlotTime) {
            currentDayIterator = addDays(currentDayIterator, 1);
        }
        previousSlotTime = slotTime;

        const slotDateStr = `${format(currentDayIterator, 'yyyy-MM-dd')}T${slotTime}:00`;
        const slotDateTimeUTC = fromZonedTime(slotDateStr, timeZone); // Convertir a UTC con la zona horaria
        const slotEndTime = addMinutes(slotDateTimeUTC, slotDuration);

        const bookedActiveCourtIdsInSlot = new Set();
        bookings.forEach(booking => {
            const overlaps = booking.startTime < slotEndTime && booking.endTime > slotDateTimeUTC;
            if (overlaps) {
                const courtIdStr = booking.court.toString();
                if(activeCourtIds.has(courtIdStr)) {
                    bookedActiveCourtIdsInSlot.add(courtIdStr);
                }
            }
        });

        const availableCourtCount = totalActiveCourts - bookedActiveCourtIdsInSlot.size;
        const hourMinute = slotTime.split(':');

        return {
            hour: parseInt(hourMinute[0], 10),
            minute: parseInt(hourMinute[1], 10),
            availableCourts: availableCourtCount,
            dateTimeISO: slotDateTimeUTC.toISOString() // Formato ISO para el frontend
        };
    });
    
    res.json({ availableSlots: availability });
    
  } catch (error) {
    console.error('Error en getAggregatedAvailability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad', error: error.message });
  }
};

module.exports = {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getAggregatedAvailability, 
};
