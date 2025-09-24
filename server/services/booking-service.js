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

    static async createFixedBookings(bookingsData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const createdBookings = [];
            for (const bookingData of bookingsData) {
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
                    throw new Error(`El turno de las ${new Date(startTime).toLocaleTimeString()} del día ${new Date(startTime).toLocaleDateString()} ya no está disponible.`);
                }

                const expirationDate = addDays(new Date(endTime), 120);

                const newBooking = new Booking({
                    court,
                    startTime,
                    endTime,
                    user,
                    status,
                    price,
                    expiresAt: expirationDate
                });
                await newBooking.save({ session });
                createdBookings.push(newBooking);
            }

            await session.commitTransaction();
            return createdBookings;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async createCashBooking(bookingData) {
        const { courtId, slots, user, date, total } = bookingData;
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const createdBookings = [];
            const pricePerSlot = total / slots.length;

            for (const slot of slots) {
                const startTime = new Date(date);
                startTime.setHours(slot.hour, slot.minute, 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000);

                const existingBooking = await Booking.findOne({
                    court: courtId,
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime },
                    status: { $in: ['Confirmed', 'Pending'] }
                }).session(session);

                if (existingBooking) {
                    throw new Error(`El turno de las ${slot.time} ya no está disponible.`);
                }

                const expirationDate = addDays(new Date(endTime), 120);

                const newBooking = new Booking({
                    court: courtId,
                    startTime,
                    endTime,
                    user,
                    status: 'Pending',
                    isPaid: false,
                    paymentMethod: 'Efectivo',
                    price: pricePerSlot,
                    expiresAt: expirationDate
                });
                await newBooking.save({ session });
                createdBookings.push(newBooking);
            }

            await session.commitTransaction();
            // Devolvemos solo el primer booking para la notificación, o podríamos devolver todos
            return createdBookings.length > 0 ? createdBookings[0] : null;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Crea múltiples reservas en una sola transacción para garantizar la atomicidad.
     * @param {Array} bookingsData - Un array de objetos de reserva.
     * @returns {Promise<Array>} - El array de reservas creadas.
     */
    static async createBulkBookings(bookingsData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const createdBookings = [];

            for (const bookingData of bookingsData) {
                const { court, startTime, endTime, user, status, price } = bookingData;

                if (price === undefined || price === null) {
                    throw new Error('El precio es obligatorio para cada reserva.');
                }

                const existingBooking = await Booking.findOne({
                    court,
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime },
                    status: { $in: ['Confirmed', 'Pending'] }
                }).session(session);

                if (existingBooking) {
                    throw new Error(`El turno de las ${new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ya no está disponible. Por favor, selecciona otro.`);
                }

                const expirationDate = addDays(new Date(endTime), 120);

                const newBooking = new Booking({
                    court,
                    startTime,
                    endTime,
                    user,
                    status,
                    price,
                    expiresAt: expirationDate
                });

                const savedBooking = await newBooking.save({ session });
                createdBookings.push(savedBooking);
            }

            await session.commitTransaction();
            return createdBookings;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = BookingService;