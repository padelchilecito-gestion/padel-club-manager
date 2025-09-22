const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { addDays } = require('date-fns'); // ⭐ Importamos addDays
// const Court = require('../models/Court'); // No necesario para este cambio, pero mantenlo si lo usas en otras partes

class BookingService {
    static async createBooking(bookingData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { court, startTime, endTime, user, status, price } = bookingData;

            if (price === undefined || price === null) {
                throw new Error('El precio es obligatorio para crear la reserva.');
            }

            const existingBooking = await Booking.findOne({
                court,
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }).session(session);

            if (existingBooking) {
                throw new Error('El turno ya no está disponible. Por favor, selecciona otro.');
            }

            // ⭐ CÁLCULO CLAVE: Definimos la fecha de expiración
            // Se eliminará 120 días después de que termine el turno
            const expirationDate = addDays(new Date(endTime), 120);

            // Guardamos la reserva incluyendo el precio y el estado
            const newBooking = new Booking({ 
                court, 
                startTime, 
                endTime, 
                user, 
                status, 
                price,
                expiresAt: expirationDate // ⭐ AÑADIDO el campo calculado
            });
            await newBooking.save({ session });

            await session.commitTransaction();
            return newBooking;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // ⭐ Si también tienes una función para ACTUALIZAR reservas (ej. BookingService.updateBooking),
    // deberías asegurarte de que también actualice el campo 'expiresAt' si se cambia 'endTime'.
    // Si no tienes una función de actualización en el servicio, no es necesario hacer nada más aquí.
}

module.exports = BookingService;