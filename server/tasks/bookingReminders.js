const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { format, addDays, startOfDay, endOfDay } = require('date-fns');
const { es } = require('date-fns/locale');

const setupBookingReminders = () => {
  // Tarea programada para ejecutarse todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily booking reminder task...');
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);

    try {
      const bookings = await Booking.find({
        startTime: { $gte: startOfTomorrow, $lte: endOfTomorrow },
        status: 'Confirmed',
        isPaid: true,
      }).populate('court', 'name');

      for (const booking of bookings) {
        let contactPhone = '';
        let contactName = '';

        if (booking.user && booking.user.phone) {
          contactPhone = booking.user.phone;
          contactName = booking.user.name || 'Cliente';
        }

        if (contactPhone) {
          const courtName = booking.court ? booking.court.name : 'tu cancha';
          const reminderMessage = `¡Hola ${contactName}! 👋 Este es un recordatorio de tu reserva de padel en ${courtName} mañana, ${format(booking.startTime, 'dd/MM HH:mm', { locale: es })}. ¡Te esperamos!`;

          const formattedPhone = contactPhone.startsWith('+') ? contactPhone.substring(1) : contactPhone;

          await sendWhatsAppMessage(formattedPhone, reminderMessage);
        }
      }
      console.log('Booking reminder task completed.');
    } catch (error) {
      console.error('Error in booking reminder task:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires"
  });
};

module.exports = setupBookingReminders;