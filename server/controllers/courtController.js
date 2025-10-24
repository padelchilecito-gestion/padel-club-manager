const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
// Asegúrate de que date-fns esté instalado en el backend: npm install date-fns date-fns-tz
const { format } = require('date-fns-tz'); 
const { startOfDay, endOfDay, parseISO } = require('date-fns');


// @desc    Create a court
// @route   POST /api/courts
// @access  Admin
const createCourt = async (req, res) => {
  // --- LÍNEA CORREGIDA ---
  // Leer los nombres correctos del body y quitar availableSlots
  const { name, courtType, pricePerHour, status } = req.body;
  // --- FIN DE CORRECCIÓN ---
  try {
    // Validar que los campos requeridos no sean undefined o null
    if (!name || !courtType || pricePerHour == null || !status) {
       return res.status(400).json({ message: 'Faltan campos obligatorios: nombre, tipo, precio por hora, estado.' });
    }
     if (isNaN(pricePerHour) || pricePerHour < 0) {
        return res.status(400).json({ message: 'El precio por hora debe ser un número válido mayor o igual a cero.' });
     }


    const court = new Court({
      name,
      courtType,    // Usar nombre correcto
      pricePerHour, // Usar nombre correcto
      status,
      // No incluir availableSlots aquí, ya no se gestiona a nivel de cancha
    });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    // Si Mongoose lanza un error de validación, lo capturamos aquí también
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
    console.error("Error en getCourts:", error); // Añadir log
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
     // Si el ID es inválido (ej. "public"), Mongoose lanza CastError
     if (error.name === 'CastError') {
       return res.status(400).json({ message: `ID de cancha inválido: ${req.params.id}` });
     }
    console.error("Error en getCourtById:", error); // Añadir log
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Admin
const updateCourt = async (req, res) => {
  // --- LEER NOMBRES CORRECTOS ---
  const { name, courtType, pricePerHour, status } = req.body;
  // --- FIN DE CORRECCIÓN ---
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
       // Validar datos antes de asignar
       if (name !== undefined) court.name = name;
       if (courtType !== undefined) court.courtType = courtType; // Usar nombre correcto
       if (pricePerHour !== undefined) {
          const parsedPrice = parseFloat(pricePerHour);
          if (isNaN(parsedPrice) || parsedPrice < 0) {
             return res.status(400).json({ message: 'El precio por hora debe ser un número válido >= 0.' });
          }
          court.pricePerHour = parsedPrice; // Usar nombre correcto
       }
       if (status !== undefined) court.status = status;
       // No modificar availableSlots aquí
      
      const updatedCourt = await court.save();
      res.json(updatedCourt);
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    // Capturar errores de validación de Mongoose al guardar
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
      await court.deleteOne(); // Usar deleteOne() que es más moderno
      res.json({ message: 'Cancha eliminada' });
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
     if (error.name === 'CastError') {
       return res.status(400).json({ message: `ID de cancha inválido: ${req.params.id}` });
     }
    console.error("Error en deleteCourt:", error); // Añadir log
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all active courts for public view
// @route   GET /api/courts/public
// @access  Public
const getPublicCourts = async (req, res) => {
  try {
    // Seleccionar los campos correctos (pricePerHour, courtType) y excluir _id si no se necesita
    const courts = await Court.find({ status: 'available' }).select(
      'name courtType pricePerHour' // Quitar availableSlots
    );
    res.json(courts);
  } catch (error) {
    console.error("Error en getPublicCourts:", error); // Añadir log
    res.status(500).json({ message: 'Server Error al obtener canchas públicas' });
  }
};

// @desc    Get court availability for a specific date and court
// @route   GET /api/courts/availability/:date/:courtId
// @access  Public
const getAvailabilityForPublic = async (req, res) => {
  try {
    const { date, courtId } = req.params;

    // Validar formato de fecha y ID
     if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Usar YYYY-MM-DD.' });
     }
     // Mongoose validará el courtId automáticamente al buscar

    const targetDate = parseISO(date);
    // Definir zona horaria explícitamente (ej: Argentina)
    const timeZone = 'America/Argentina/Buenos_Aires'; 
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);


    // 1. Encontrar la cancha y obtener sus horarios globales si es necesario
    const court = await Court.findById(courtId);
    if (!court || court.status !== 'available') {
      return res.status(404).json({ message: 'Cancha no encontrada o no disponible.' });
    }

    // --- Obtener horarios globales (¡IMPORTANTE!) ---
    // Necesitamos openTime, closeTime, slotDuration de la configuración general
    const settingsArray = await Setting.find({ key: { $in: ['openTime', 'closeTime', 'slotDuration'] } });
    const settings = settingsArray.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

    if (!settings.openTime || !settings.closeTime || !settings.slotDuration) {
        console.error("Configuración de horarios globales incompleta:", settings);
        return res.status(500).json({ message: 'Configuración de horarios del club incompleta.' });
    }

    const slotDurationMinutes = parseInt(settings.slotDuration, 10);
    if (isNaN(slotDurationMinutes) || slotDurationMinutes <= 0) {
        console.error("Duración de slot inválida:", settings.slotDuration);
        return res.status(500).json({ message: 'Duración de slot inválida en la configuración.' });
    }
    
    // Generar TODOS los slots posibles para el día según la config global
    const allPossibleSlots = generateTimeSlots(settings.openTime, settings.closeTime, slotDurationMinutes);
    if (!allPossibleSlots || allPossibleSlots.length === 0) {
        console.error("No se pudieron generar slots con:", settings);
        return res.status(500).json({ message: 'Error al generar horarios según la configuración.' });
    }
    // --- Fin obtención horarios globales ---


    // 2. Encontrar reservas (Bookings) para esa cancha en ese día
    const bookings = await Booking.find({
      court: courtId,
      startTime: {
        $gte: dayStart,
        $lte: dayEnd,
      },
      status: { $in: ['confirmed', 'paid', 'pending'] }, // Estados que ocupan el slot
    });

    // 3. Crear la lista de disponibilidad comparando con TODOS los slots posibles
    // Obtener solo la hora HH:mm de las reservas existentes
    const bookedStartTimes = bookings.map(b => format(b.startTime, 'HH:mm', { timeZone })); 
    
    const availability = allPossibleSlots.map(slotTime => {
      const isBooked = bookedStartTimes.includes(slotTime);
      return {
        startTime: slotTime,
        isAvailable: !isBooked,
      };
    });

    res.json(availability);
  } catch (error) {
     // Capturar CastError si el courtId es inválido
     if (error.name === 'CastError') {
       return res.status(400).json({ message: `ID de cancha inválido: ${req.params.courtId}` });
     }
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad.', error: error.message });
  }
};


// --- Función Helper para generar slots ---
function generateTimeSlots(openTime, closeTime, slotDurationMinutes) {
    if (!openTime || !closeTime || !slotDurationMinutes) return [];

    const slots = [];
    try {
        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);

        let currentHour = openHour;
        let currentMinute = openMinute;

        // Crear objeto Date para comparar (usamos una fecha fija, solo importan las horas/minutos)
        const closeDateTime = new Date(2000, 0, 1, closeHour, closeMinute);

        while (true) {
            const currentDateTime = new Date(2000, 0, 1, currentHour, currentMinute);
            
            // Si la hora actual es >= hora de cierre, parar
            if (currentDateTime >= closeDateTime) {
                break;
            }

            // Formatear HH:mm
            const formattedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            slots.push(formattedTime);

            // Calcular siguiente slot
            currentMinute += slotDurationMinutes;
            currentHour += Math.floor(currentMinute / 60);
            currentMinute %= 60;

            // Seguridad anti-bucle infinito (más de 24 horas de slots)
            if (slots.length > (24 * 60 / slotDurationMinutes)) {
                 console.error("Bucle infinito detectado en generateTimeSlots");
                 return []; // Devolver vacío en caso de error
            }
        }
    } catch (e) {
        console.error("Error generando slots:", e, { openTime, closeTime, slotDurationMinutes });
        return []; // Devolver vacío en caso de error
    }
    return slots;
}
// --- Fin Función Helper ---


module.exports = {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getPublicCourts,
  getAvailabilityForPublic,
};
