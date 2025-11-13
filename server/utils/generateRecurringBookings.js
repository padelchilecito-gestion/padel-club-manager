const RecurringBooking = require('../models/RecurringBooking');
const Booking = require('../models/Booking');
const { zonedTimeToUtc } = require('date-fns-tz');
const { addDays, format, startOfDay } = require('date-fns');

const timeZone = 'America/Argentina/Buenos_Aires';

const generateRecurringBookings = async () => {
  console.log('[CRON] Checking for recurring bookings to generate...');
  
  const today = new Date();
  const targetDate = addDays(today, 7); // Genera con 1 semana de anticipación
  const targetDayOfWeek = targetDate.getDay();
  
  const activeRecurring = await RecurringBooking.find({
    isActive: true,
    dayOfWeek: targetDayOfWeek,
    startDate: { $lte: targetDate },
    $or: [
      { endDate: null },
      { endDate: { $gte: targetDate } }
    ],
  }).populate('court');

  if (activeRecurring.length > 0) {
     console.log(`[CRON] Found ${activeRecurring.length} recurring bookings to generate for ${format(targetDate, 'yyyy-MM-dd')}`);
  }

  for (const rec of activeRecurring) {
    const [hours, minutes] = rec.startTime.split(':').map(Number);
    
    // Importante: partimos de la fecha UTC pero la tratamos como si fuera local para el setHours
    const targetDateInLocal = startOfDay(targetDate);
    targetDateInLocal.setHours(hours, minutes, 0, 0);
    
    // Convertimos esa hora local a UTC real
    const startTime = zonedTimeToUtc(targetDateInLocal, timeZone);
    const endTime = new Date(startTime.getTime() + rec.duration * 60 * 1000);

    // Verificar si ya existe
    const existing = await Booking.findOne({
      court: rec.court._id,
      startTime,
      status: { $ne: 'Cancelled' },
    });

    if (existing) {
      console.log(`[CRON] Booking already exists for ${rec.court.name} on ${format(startTime, 'yyyy-MM-dd HH:mm')}`);
      continue;
    }

    // Crear la reserva
    const booking = new Booking({
      court: rec.court._id,
      user: rec.user,
      startTime,
      endTime,
      price: rec.price,
      paymentMethod: rec.paymentMethod,
      isPaid: rec.isPaid,
      status: 'Confirmed',
    });

    await booking.save();
    console.log(`[CRON] Created recurring booking for ${rec.user.name} on ${rec.court.name}`);
  }
};

module.exports = generateRecurringBookings;
