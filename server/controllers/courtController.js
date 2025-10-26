const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
// --- CORRECCIÓN DE IMPORTACIÓN (Separamos date-fns y date-fns-tz) ---
const { startOfDay, endOfDay, parseISO, addMinutes } = require('date-fns'); // Funciones básicas
const { zonedTimeToUtc } = require('date-fns-tz'); // Solo para conversión TZ
// --- FIN DE CORRECCIÓN ---
const { generateTimeSlots } = require('../utils/timeSlotGenerator');

const getAggregatedAvailability = async (req, res) => {
  try {
    const { date } = req.params; // 'date' es 'yyyy-MM-dd'
    const timeZone = 'America/Argentina/Buenos_Aires';

    // 1. Buscar settings
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {});
    console.log('CONFIGURACIÓN REDUCIDA:', settings);

    // 2. Parsear y validar slotDuration
    const slotDuration = parseInt(settings.slotDuration, 10);
    if (!settings || !settings.openTime || !settings.closeTime || !slotDuration || slotDuration <= 0) {
      console.error('ERROR: Validación de settings falló. Datos:', settings);
      return res.status(400).json({ /* ... mensaje ... */ });
    }

    // 3. Generar slots
    const allPossibleSlots = generateTimeSlots(settings.openTime, settings.closeTime, slotDuration);

    // 4. Buscar canchas activas
    const activeCourts = await Court.find({ isActive: true }).select('name pricePerHour');
    if (!activeCourts || activeCourts.length === 0) {
      return res.status(404).json({ message: 'No se encontraron canchas activas.' });
    }

    // 5. Buscar reservas del día
    // --- CORRECCIÓN DE LÓGICA (Usamos date-fns + zonedTimeToUtc) ---
    // Creamos objetos Date que representen el inicio y fin del día EN LA ZONA HORARIA local,
    // luego los convertimos a UTC para la consulta a la BD.
    // parseISO convierte 'yyyy-MM-dd' a un objeto Date (en UTC medianoche por defecto)
    const dateObj = parseISO(date); 
    const start = zonedTimeToUtc(startOfDay(dateObj), timeZone); // Inicio del día en Argentina, convertido a UTC
    const end = zonedTimeToUtc(endOfDay(dateObj), timeZone);     // Fin del día en Argentina, convertido a UTC
    // --- FIN DE CORRECCIÓN ---

    const bookings = await Booking.find({
      startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' }
    }).select('court startTime');

    // 6. Mapear disponibilidad
    const availability = allPossibleSlots.map(slotTime => {
      // --- CORRECCIÓN DE USO ---
      // Convertimos la hora específica del slot en Argentina a UTC
      const slotDateTimeUTC = zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);
      // --- FIN DE CORRECCIÓN ---

      const bookedCourtIds = bookings.filter(b => b.startTime.getTime() === slotDateTimeUTC.getTime()).map(b => b.court.toString());
      const availableCourts = activeCourts.filter(c => !bookedCourtIds.includes(c._id.toString()));
      if (availableCourts.length > 0) {
        availableCourts.sort((a, b) => a.pricePerHour - b.pricePerHour);
        const cheapestCourt = availableCourts[0];
        return { startTime: slotTime, isAvailable: true, price: cheapestCourt.pricePerHour, courtId: cheapestCourt._id, courtName: cheapestCourt.name };
      } else {
        return { startTime: slotTime, isAvailable: false, price: 0, courtId: null, courtName: null };
      }
    });
    res.json(availability);
  } catch (error) {
    console.error('Error en getAggregatedAvailability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad agregada', error: error.message });
  }
};

/* --- CÓDIGO ORIGINAL (con corrección de uso) --- */
const getCourts = async (req, res) => { /* ... */ };
const createCourt = async (req, res) => { /* ... */ };
const getCourtById = async (req, res) => { /* ... */ };
const updateCourt = async (req, res) => { /* ... */ };
const deleteCourt = async (req, res) => { /* ... */ };
const getPublicCourts = async (req, res) => { /* ... */ };

// Corregimos esta función también
const getAvailabilityForPublic = async (req, res) => {
  try {
    const { date, courtId } = req.params;
    const timeZone = 'America/Argentina/Buenos_Aires';
    const court = await Court.findById(courtId);
    if (!court || !court.isActive) return res.status(404).json({ message: 'Cancha no encontrada o inactiva.' });

    // --- CORRECCIÓN DE LÓGICA ---
    const dateObj = parseISO(date);
    const start = zonedTimeToUtc(startOfDay(dateObj), timeZone);
    const end = zonedTimeToUtc(endOfDay(dateObj), timeZone);
    // --- FIN DE CORRECCIÓN ---

    const bookings = await Booking.find({ court: courtId, startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } });
    const availableSlots = court.availableSlots || [];
    const availability = availableSlots.map(slotTime => {
      // --- CORRECCIÓN DE USO ---
      const slotDateTimeUTC = zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);
      // --- FIN DE CORRECCIÓN ---
      const isBooked = bookings.some(b => b.startTime.getTime() === slotDateTimeUTC.getTime());
      return { startTime: slotTime, isAvailable: !isBooked };
    });
    res.json(availability);
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: 'Error al obtener la disponibilidad' });
  }
};

module.exports = {
  getAggregatedAvailability, getCourts, createCourt, getCourtById,
  updateCourt, deleteCourt, getPublicCourts, getAvailabilityForPublic,
};
