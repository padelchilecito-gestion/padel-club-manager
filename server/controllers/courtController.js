const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { zonedTimeToUtc, startOfDay, endOfDay } = require('date-fns-tz');
const { getSettings } = require('./settingController'); // Importar getSettings
const { generateTimeSlots } = require('../utils/timeSlotGenerator'); // (Necesitaremos crear este archivo)

// --- NUEVA FUNCIÓN (Punto 1) ---
// Obtiene la disponibilidad agregada (fecha primero)
const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';

    // 1. Obtener la configuración para saber los horarios de apertura/cierre
    // Usamos 'await' ya que getSettings es async
    const settings = await getSettings(); 
    if (!settings || !settings.openTime || !settings.closeTime || !settings.slotDuration) {
      // Si no hay settings, no podemos generar slots
      return res.status(400).json({ message: 'La configuración del club no está completa.' });
    }

    // 2. Generar todos los slots posibles para ese día
    const allPossibleSlots = generateTimeSlots(
      settings.openTime,
      settings.closeTime,
      settings.slotDuration
    );

    // 3. Obtener todas las canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('name pricePerHour');

    // 4. Obtener todas las reservas (bookings) para ese día
    const start = startOfDay(zonedTimeToUtc(date, timeZone));
    const end = endOfDay(zonedTimeToUtc(date, timeZone));
    
    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end },
      status: { $ne: 'Cancelled' }
    }).select('court startTime');

    // 5. Mapear la disponibilidad
    const availability = allPossibleSlots.map(slotTime => {
      
      // Convertir el string 'HH:mm' a un objeto Date en UTC para comparar
      const slotDateTimeUTC = zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);

      // Encontrar las canchas que están reservadas en este slot
      const bookedCourtIds = bookings
        .filter(b => b.startTime.getTime() === slotDateTimeUTC.getTime())
        .map(b => b.court.toString());

      // Filtrar para encontrar canchas que NO estén reservadas
      const availableCourts = activeCourts.filter(
        c => !bookedCourtIds.includes(c._id.toString())
      );

      if (availableCourts.length > 0) {
        // Encontrar la más barata (Punto 1)
        availableCourts.sort((a, b) => a.pricePerHour - b.pricePerHour);
        const cheapestCourt = availableCourts[0];
        
        return {
          startTime: slotTime,
          isAvailable: true,
          price: cheapestCourt.pricePerHour, // Precio del turno (para el total)
          courtId: cheapestCourt._id,     // Cancha asignada
          courtName: cheapestCourt.name,
        };
      } else {
        // No hay canchas disponibles
        return {
          startTime: slotTime,
          isAvailable: false,
          price: 0,
          courtId: null,
          courtName: null,
        };
      }
    });

    res.json(availability);

  } catch (error) {
    console.error('Error en getAggregatedAvailability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad agregada', error: error.message });
  }
};


// (El resto de funciones de courtController.js... getCourts, createCourt, etc.)
// ... (copia el resto de tu archivo aquí)

module.exports = {
  getAggregatedAvailability, // Exportar la nueva función
  // ... (exporta el resto de tus funciones: getCourts, createCourt, getCourtById, updateCourt, deleteCourt, getPublicCourts, getAvailabilityForPublic)
};
