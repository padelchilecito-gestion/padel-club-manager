const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { format } = require('date-fns-tz'); 
const { startOfDay, endOfDay, parseISO } = require('date-fns');


// @desc    Create a court
// @route   POST /api/courts
// @access  Admin
const createCourt = async (req, res) => {
  // --- AÑADIR LOGGING DETALLADO AQUÍ ---
  console.log('--- [Debug Create Court] ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('req.body RECIBIDO:', JSON.stringify(req.body, null, 2)); 
  // --- FIN DEL LOGGING ---

  // Intentamos leer los nombres NUEVOS primero
  let { name, courtType, pricePerHour, status } = req.body;

  // --- LOGGING DE VARIABLES EXTRAÍDAS ---
  console.log('[Debug Create Court] Valores extraídos (esperados):');
  console.log('  name:', name);
  console.log('  courtType:', courtType);
  console.log('  pricePerHour:', pricePerHour);
  console.log('  status:', status);
  // --- FIN LOGGING ---
  
  // --- BLOQUE DE COMPATIBILIDAD TEMPORAL (POR SI ACASO) ---
  // Si los campos nuevos NO llegaron, intentar leer los viejos
  if (courtType === undefined && req.body.type !== undefined) {
      console.warn('[Debug Create Court] WARNING: Recibido campo antiguo "type", usando como courtType.');
      courtType = req.body.type;
  }
  if (pricePerHour === undefined && req.body.price !== undefined) {
      console.warn('[Debug Create Court] WARNING: Recibido campo antiguo "price", usando como pricePerHour.');
      pricePerHour = req.body.price;
  }
   // --- FIN BLOQUE COMPATIBILIDAD ---


  try {
    console.log('[Debug Create Court] Intentando validación y creación...');
    // Validar que los campos requeridos (con los nombres NUEVOS) no sean undefined o null
    if (!name || !courtType || pricePerHour == null || !status) {
       console.error('[Debug Create Court] Error: Faltan campos obligatorios:', { name, courtType, pricePerHour, status });
       // Ser más específico en el mensaje de error devuelto
       let missing = [];
       if (!name) missing.push('nombre');
       if (!courtType) missing.push('tipo');
       if (pricePerHour == null) missing.push('precio por hora');
       if (!status) missing.push('estado');
       return res.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    }
     const parsedPrice = parseFloat(pricePerHour); // Convertir aquí
     if (isNaN(parsedPrice) || parsedPrice < 0) {
        console.error('[Debug Create Court] Error: Precio inválido:', pricePerHour);
        return res.status(400).json({ message: 'El precio por hora debe ser un número válido mayor o igual a cero.' });
     }


    const court = new Court({
      name,
      courtType,    // Usar nombre correcto
      pricePerHour: parsedPrice, // Usar nombre correcto y valor parseado
      status,
      // No incluir availableSlots
    });
    
    console.log('[Debug Create Court] Objeto Court a guardar:', JSON.stringify(court.toObject(), null, 2));
    
    const createdCourt = await court.save(); // La validación de Mongoose ocurre aquí
    
    console.log('[Debug Create Court] Cancha creada con éxito:', createdCourt._id);
    console.log('--- [Debug Create Court] Finalizado ---');
    res.status(201).json(createdCourt);

  } catch (error) {
    // Capturar y loguear el error de Mongoose
    console.error('[Debug Create Court] ¡ERROR DURANTE court.save()!');
    console.error('  Tipo de Error:', error.name); // Ej: ValidationError
    console.error('  Mensaje:', error.message);
    // Loguear detalles específicos de errores de validación
     if (error.name === 'ValidationError' && error.errors) {
       console.error('  Detalles de Validación:');
       for (const field in error.errors) {
         console.error(`    - Campo '${field}': ${error.errors[field].message}`);
       }
     }
    console.error('  Stack:', error.stack); // Stack trace completo
    console.log('--- [Debug Create Court] Finalizado con Error ---');
    
    // Devolver el error al frontend
    res.status(400).json({ message: error.message });
  }
};

// ... (El resto de las funciones: getCourts, getCourtById, updateCourt, deleteCourt, getPublicCourts, getAvailabilityForPublic, generateTimeSlots) ...
// ... (Asegúrate de copiar el resto del archivo desde la versión anterior que te pasé) ...

// @desc    Get all courts (admin view)
// @route   GET /api/courts
// @access  Admin
const getCourts = async (req, res) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    console.error("Error en getCourts:", error); 
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
     if (error.name === 'CastError') {
       return res.status(400).json({ message: `ID de cancha inválido: ${req.params.id}` });
     }
    console.error("Error en getCourtById:", error); 
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Admin
const updateCourt = async (req, res) => {
  // --- LOGGING PARA UPDATE ---
  console.log(`--- [Debug Update Court ID: ${req.params.id}] ---`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('req.body RECIBIDO:', JSON.stringify(req.body, null, 2));
  // --- FIN LOGGING ---

  // Leer los nombres correctos
  const { name, courtType, pricePerHour, status } = req.body;
   console.log('[Debug Update Court] Valores extraídos:');
   console.log('  name:', name);
   console.log('  courtType:', courtType);
   console.log('  pricePerHour:', pricePerHour);
   console.log('  status:', status);
   
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
       console.log('[Debug Update Court] Cancha encontrada. Aplicando cambios...');
       // Validar datos antes de asignar
       let changesMade = false;
       if (name !== undefined && court.name !== name) { court.name = name; changesMade = true; console.log('  - name actualizado'); }
       if (courtType !== undefined && court.courtType !== courtType) { court.courtType = courtType; changesMade = true; console.log('  - courtType actualizado'); } // Usar nombre correcto
       if (pricePerHour !== undefined) {
          const parsedPrice = parseFloat(pricePerHour);
          if (isNaN(parsedPrice) || parsedPrice < 0) {
             console.error('[Debug Update Court] Error: Precio inválido:', pricePerHour);
             return res.status(400).json({ message: 'El precio por hora debe ser un número válido >= 0.' });
          }
          if (court.pricePerHour !== parsedPrice) {
            court.pricePerHour = parsedPrice; changesMade = true; console.log('  - pricePerHour actualizado'); // Usar nombre correcto
          }
       }
       if (status !== undefined && court.status !== status) { court.status = status; changesMade = true; console.log('  - status actualizado'); }
       
       if (!changesMade) {
          console.log('[Debug Update Court] No se detectaron cambios.');
          console.log('--- [Debug Update Court] Finalizado ---');
          return res.json(court); // Devolver la cancha sin cambios
       }
       
       console.log('[Debug Update Court] Intentando guardar cambios...');
       const updatedCourt = await court.save(); // La validación ocurre aquí
       console.log('[Debug Update Court] Cambios guardados con éxito.');
       console.log('--- [Debug Update Court] Finalizado ---');
       res.json(updatedCourt);
    } else {
      console.warn(`[Debug Update Court] Cancha no encontrada con ID: ${req.params.id}`);
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
    // Capturar y loguear errores de Mongoose
    console.error('[Debug Update Court] ¡ERROR DURANTE court.save()!');
    console.error('  Tipo de Error:', error.name);
    console.error('  Mensaje:', error.message);
     if (error.name === 'ValidationError' && error.errors) {
       console.error('  Detalles de Validación:');
       for (const field in error.errors) {
         console.error(`    - Campo '${field}': ${error.errors[field].message}`);
       }
     }
    console.error('  Stack:', error.stack);
    console.log('--- [Debug Update Court] Finalizado con Error ---');
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
      await court.deleteOne(); 
      res.json({ message: 'Cancha eliminada' });
    } else {
      res.status(404).json({ message: 'Cancha no encontrada' });
    }
  } catch (error) {
     if (error.name === 'CastError') {
       return res.status(400).json({ message: `ID de cancha inválido: ${req.params.id}` });
     }
    console.error("Error en deleteCourt:", error); 
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all active courts for public view
// @route   GET /api/courts/public
// @access  Public
const getPublicCourts = async (req, res) => {
  try {
    const courts = await Court.find({ status: 'available' }).select(
      'name courtType pricePerHour' // Nombres correctos
    );
    res.json(courts);
  } catch (error) {
    console.error("Error en getPublicCourts:", error); 
    res.status(500).json({ message: 'Server Error al obtener canchas públicas' });
  }
};

// @desc    Get court availability for a specific date and court
// @route   GET /api/courts/availability/:date/:courtId
// @access  Public
const getAvailabilityForPublic = async (req, res) => {
  try {
    const { date, courtId } = req.params;

     if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Usar YYYY-MM-DD.' });
     }
     
    const targetDate = parseISO(date);
    const timeZone = 'America/Argentina/Buenos_Aires'; 
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const court = await Court.findById(courtId);
    if (!court || court.status !== 'available') {
      return res.status(404).json({ message: 'Cancha no encontrada o no disponible.' });
    }

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
    
    const allPossibleSlots = generateTimeSlots(settings.openTime, settings.closeTime, slotDurationMinutes);
    if (!allPossibleSlots || allPossibleSlots.length === 0) {
        console.error("No se pudieron generar slots con:", settings);
        return res.status(500).json({ message: 'Error al generar horarios según la configuración.' });
    }

    const bookings = await Booking.find({
      court: courtId,
      startTime: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['confirmed', 'paid', 'pending'] }, 
    });

    const bookedStartTimes = bookings.map(b => format(b.startTime, 'HH:mm', { timeZone })); 
    
    const availability = allPossibleSlots.map(slotTime => ({
      startTime: slotTime,
      isAvailable: !bookedStartTimes.includes(slotTime),
    }));

    res.json(availability);
  } catch (error) {
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
        const closeDateTime = new Date(2000, 0, 1, closeHour, closeMinute);

        while (true) {
            const currentDateTime = new Date(2000, 0, 1, currentHour, currentMinute);
            if (currentDateTime >= closeDateTime) break;
            const formattedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            slots.push(formattedTime);
            currentMinute += slotDurationMinutes;
            currentHour += Math.floor(currentMinute / 60);
            currentMinute %= 60;
            if (slots.length > (1440 / slotDurationMinutes)) { // 1440 minutos en un día
                 console.error("Bucle potencialmente infinito detectado en generateTimeSlots");
                 return []; 
            }
        }
    } catch (e) {
        console.error("Error generando slots:", e, { openTime, closeTime, slotDurationMinutes });
        return []; 
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
