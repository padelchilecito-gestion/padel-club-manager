const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { addDays, isValid } = require('date-fns');

class BookingService {
    /**
     * Valida los datos de entrada para crear una reserva
     * @param {Object} bookingData - Datos de la reserva
     * @throws {Error} Si los datos no son válidos
     */
    static validateBookingData(bookingData) {
        const { court, startTime, endTime, user, price } = bookingData;

        if (!court) {
            throw new Error('El ID de la cancha es obligatorio.');
        }

        if (!mongoose.Types.ObjectId.isValid(court)) {
            throw new Error('El ID de la cancha no es válido.');
        }

        if (!startTime || !endTime) {
            throw new Error('Las fechas de inicio y fin son obligatorias.');
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (!isValid(start) || !isValid(end)) {
            throw new Error('Las fechas proporcionadas no son válidas.');
        }

        if (start >= end) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio.');
        }

        if (!user || !user.name || !user.phone) {
            throw new Error('Los datos del usuario (nombre y teléfono) son obligatorios.');
        }

        if (user.name.length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres.');
        }

        if (user.phone.length < 8) {
            throw new Error('El teléfono debe tener al menos 8 dígitos.');
        }

        if (price === undefined || price === null || price < 0) {
            throw new Error('El precio es obligatorio y debe ser un número positivo.');
        }
    }

    /**
     * Verifica si existe un conflicto de horario
     * @param {ObjectId} courtId - ID de la cancha
     * @param {Date} startTime - Hora de inicio
     * @param {Date} endTime - Hora de fin
     * @param {Object} session - Sesión de transacción MongoDB
     * @param {ObjectId} excludeBookingId - ID de reserva a excluir (para actualizaciones)
     * @returns {Promise<Booking|null>} Reserva conflictiva o null
     */
    static async checkTimeConflict(courtId, startTime, endTime, session, excludeBookingId = null) {
        const query = {
            court: courtId,
            $or: [
                // Caso 1: La nueva reserva empieza durante una reserva existente
                { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
                // Caso 2: La nueva reserva termina durante una reserva existente
                { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
                // Caso 3: La nueva reserva engloba completamente una reserva existente
                { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
            ],
            status: { $in: ['Confirmed', 'Pending'] }
        };

        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }

        return await Booking.findOne(query).session(session);
    }

    /**
     * Calcula la fecha de expiración para una reserva
     * @param {Date} endTime - Fecha de fin de la reserva
     * @returns {Date} Fecha de expiración
     */
    static calculateExpirationDate(endTime) {
        return addDays(new Date(endTime), 120);
    }

    /**
     * Crea una única reserva
     * @param {Object} bookingData - Datos de la reserva
     * @returns {Promise<Booking>} Reserva creada
     */
    static async createBooking(bookingData) {
        // Validar datos de entrada
        this.validateBookingData(bookingData);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { court, startTime, endTime, user, status = 'Pending', price, paymentMethod = 'Pendiente' } = bookingData;

            // Verificar que la cancha existe y está activa
            const courtExists = await Court.findOne({ _id: court, isActive: true }).session(session);
            if (!courtExists) {
                throw new Error('La cancha seleccionada no existe o no está disponible.');
            }

            // Verificar conflictos de horario
            const conflictingBooking = await this.checkTimeConflict(court, startTime, endTime, session);
            if (conflictingBooking) {
                const conflictTime = new Date(conflictingBooking.startTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                throw new Error(`El turno de las ${conflictTime} ya no está disponible. Por favor, selecciona otro.`);
            }

            // Calcular fecha de expiración
            const expirationDate = this.calculateExpirationDate(endTime);

            // Crear la reserva
            const newBooking = new Booking({
                court,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                user: {
                    name: user.name.trim(),
                    phone: user.phone.trim()
                },
                status,
                price: Number(price),
                paymentMethod,
                expiresAt: expirationDate,
                isPaid: status === 'Confirmed' && paymentMethod !== 'Efectivo'
            });

            const savedBooking = await newBooking.save({ session });
            await session.commitTransaction();

            console.log(`Reserva creada exitosamente: ${savedBooking._id} para ${user.name}`);
            return savedBooking;

        } catch (error) {
            await session.abortTransaction();
            console.error('Error en createBooking:', error.message);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Crea múltiples reservas de forma atómica
     * @param {Array} bookingsData - Array de datos de reservas
     * @returns {Promise<Array<Booking>>} Array de reservas creadas
     */
    static async createBulkBookings(bookingsData) {
        if (!Array.isArray(bookingsData) || bookingsData.length === 0) {
            throw new Error('Se debe proporcionar un array no vacío de reservas.');
        }

        // Validar todos los datos antes de empezar la transacción
        bookingsData.forEach((bookingData, index) => {
            try {
                this.validateBookingData(bookingData);
            } catch (error) {
                throw new Error(`Error en reserva ${index + 1}: ${error.message}`);
            }
        });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const createdBookings = [];

            // Verificar que todas las canchas existen
            const courtIds = [...new Set(bookingsData.map(b => b.court))];
            const courts = await Court.find({ _id: { $in: courtIds }, isActive: true }).session(session);

            if (courts.length !== courtIds.length) {
                const foundCourtIds = courts.map(c => c._id.toString());
                const missingCourts = courtIds.filter(id => !foundCourtIds.includes(id.toString()));
                throw new Error(`Las siguientes canchas no existen o no están disponibles: ${missingCourts.join(', ')}`);
            }

            // Procesar cada reserva
            for (const [index, bookingData] of bookingsData.entries()) {
                const { court, startTime, endTime, user, status = 'Pending', price, paymentMethod = 'Pendiente' } = bookingData;

                // Verificar conflictos
                const conflictingBooking = await this.checkTimeConflict(court, startTime, endTime, session);
                if (conflictingBooking) {
                    const conflictTime = new Date(conflictingBooking.startTime).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const conflictDate = new Date(conflictingBooking.startTime).toLocaleDateString('es-ES');
                    throw new Error(`Conflicto en reserva ${index + 1}: El turno de las ${conflictTime} del ${conflictDate} ya no está disponible.`);
                }

                // Crear la reserva
                const expirationDate = this.calculateExpirationDate(endTime);
                const newBooking = new Booking({
                    court,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    user: {
                        name: user.name.trim(),
                        phone: user.phone.trim()
                    },
                    status,
                    price: Number(price),
                    paymentMethod,
                    expiresAt: expirationDate,
                    isPaid: status === 'Confirmed' && paymentMethod !== 'Efectivo'
                });

                const savedBooking = await newBooking.save({ session });
                createdBookings.push(savedBooking);
            }

            await session.commitTransaction();
            console.log(`${createdBookings.length} reservas creadas exitosamente`);
            return createdBookings;

        } catch (error) {
            await session.abortTransaction();
            console.error('Error en createBulkBookings:', error.message);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Crea una reserva con pago en efectivo
     * @param {Object} bookingData - Datos de la reserva en efectivo
     * @returns {Promise<Array<Booking>>} Array de reservas creadas
     */
    static async createCashBooking(bookingData) {
        const { courtId, slots, user, date, total } = bookingData;

        // Validaciones específicas para pago en efectivo
        if (!courtId || !mongoose.Types.ObjectId.isValid(courtId)) {
            throw new Error('ID de cancha inválido.');
        }

        if (!Array.isArray(slots) || slots.length === 0) {
            throw new Error('Se debe proporcionar al menos un slot de tiempo.');
        }

        if (!user || !user.name || !user.phone) {
            throw new Error('Datos de usuario incompletos.');
        }

        if (!date) {
            throw new Error('La fecha es obligatoria.');
        }

        if (!total || total <= 0) {
            throw new Error('El total debe ser mayor a cero.');
        }

        // Validar que los slots tengan el formato correcto
        const invalidSlots = slots.filter(slot =>
            !slot.time ||
            typeof slot.hour !== 'number' ||
            typeof slot.minute !== 'number' ||
            slot.hour < 0 || slot.hour > 23 ||
            slot.minute < 0 || slot.minute > 59
        );

        if (invalidSlots.length > 0) {
            throw new Error('Formato de slots inválido.');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verificar que la cancha existe
            const court = await Court.findOne({ _id: courtId, isActive: true }).session(session);
            if (!court) {
                throw new Error('La cancha seleccionada no existe o no está disponible.');
            }

            const createdBookings = [];
            const pricePerSlot = total / slots.length;
            const bookingDate = new Date(date);

            // Crear reserva para cada slot
            for (const [index, slot] of slots.entries()) {
                const startTime = new Date(bookingDate);
                // *** CORRECCIÓN CLAVE ***
                // Usamos setUTCHours para evitar problemas de zona horaria en el servidor
                startTime.setUTCHours(slot.hour, slot.minute, 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutos

                // Verificar conflictos
                const conflictingBooking = await this.checkTimeConflict(courtId, startTime, endTime, session);
                if (conflictingBooking) {
                    throw new Error(`El turno de las ${slot.time} ya no está disponible.`);
                }

                // Crear la reserva
                const expirationDate = this.calculateExpirationDate(endTime);
                const newBooking = new Booking({
                    court: courtId,
                    startTime,
                    endTime,
                    user: {
                        name: user.name.trim(),
                        phone: user.phone.trim()
                    },
                    status: 'Pending',
                    isPaid: false,
                    paymentMethod: 'Efectivo',
                    price: pricePerSlot,
                    expiresAt: expirationDate
                });

                const savedBooking = await newBooking.save({ session });
                createdBookings.push(savedBooking);
            }

            await session.commitTransaction();
            console.log(`${createdBookings.length} reservas en efectivo creadas para ${user.name}`);
            return createdBookings;

        } catch (error) {
            await session.abortTransaction();
            console.error('Error en createCashBooking:', error.message);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Actualiza el estado de una reserva
     * @param {ObjectId} bookingId - ID de la reserva
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Booking>} Reserva actualizada
     */
    static async updateBooking(bookingId, updateData) {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error('ID de reserva inválido.');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const booking = await Booking.findById(bookingId).session(session);
            if (!booking) {
                throw new Error('Reserva no encontrada.');
            }

            // Si se está actualizando el horario, verificar conflictos
            if (updateData.startTime || updateData.endTime) {
                const startTime = updateData.startTime ? new Date(updateData.startTime) : booking.startTime;
                const endTime = updateData.endTime ? new Date(updateData.endTime) : booking.endTime;

                const conflictingBooking = await this.checkTimeConflict(
                    booking.court,
                    startTime,
                    endTime,
                    session,
                    bookingId
                );

                if (conflictingBooking) {
                    throw new Error('El nuevo horario genera un conflicto con otra reserva.');
                }

                // Actualizar fecha de expiración si cambia el endTime
                if (updateData.endTime) {
                    updateData.expiresAt = this.calculateExpirationDate(endTime);
                }
            }

            // Actualizar la reserva
            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                { $set: updateData },
                { new: true, session }
            );

            await session.commitTransaction();
            console.log(`Reserva ${bookingId} actualizada exitosamente`);
            return updatedBooking;

        } catch (error) {
            await session.abortTransaction();
            console.error('Error en updateBooking:', error.message);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Cancela una reserva
     * @param {ObjectId} bookingId - ID de la reserva
     * @param {string} reason - Motivo de cancelación
     * @returns {Promise<Booking>} Reserva cancelada
     */
    static async cancelBooking(bookingId, reason = 'Cancelado por el usuario') {
        return await this.updateBooking(bookingId, {
            status: 'Cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason
        });
    }

    /**
     * Confirma el pago de una reserva
     * @param {ObjectId} bookingId - ID de la reserva
     * @param {string} paymentMethod - Método de pago
     * @param {string} paymentId - ID del pago (opcional)
     * @returns {Promise<Booking>} Reserva confirmada
     */
    static async confirmPayment(bookingId, paymentMethod, paymentId = null) {
        const updateData = {
            status: 'Confirmed',
            isPaid: true,
            paymentMethod,
            paidAt: new Date()
        };

        if (paymentId) {
            updateData.paymentId = paymentId;
        }

        return await this.updateBooking(bookingId, updateData);
    }

    /**
     * Obtiene reservas con filtros
     * @param {Object} filters - Filtros de búsqueda
     * @param {Object} options - Opciones de paginación y ordenamiento
     * @returns {Promise<Array<Booking>>} Array de reservas
     */
    static async getBookings(filters = {}, options = {}) {
        try {
            const {
                limit = 50,
                skip = 0,
                sort = { startTime: -1 },
                populate = ['court']
            } = options;

            let query = Booking.find(filters);

            if (populate.length > 0) {
                populate.forEach(field => {
                    query = query.populate(field);
                });
            }

            query = query
                .sort(sort)
                .limit(limit)
                .skip(skip);

            const bookings = await query.exec();
            return bookings;

        } catch (error) {
            console.error('Error en getBookings:', error.message);
            throw new Error(`Error al obtener reservas: ${error.message}`);
        }
    }

    /**
     * Verifica si una cancha está disponible en un rango de tiempo
     * @param {ObjectId} courtId - ID de la cancha
     * @param {Date} startTime - Hora de inicio
     * @param {Date} endTime - Hora de fin
     * @returns {Promise<boolean>} true si está disponible
     */
    static async isCourtAvailable(courtId, startTime, endTime) {
        try {
            if (!mongoose.Types.ObjectId.isValid(courtId)) {
                return false;
            }

            const conflictingBooking = await Booking.findOne({
                court: courtId,
                $or: [
                    { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
                    { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
                    { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
                ],
                status: { $in: ['Confirmed', 'Pending'] }
            });

            return !conflictingBooking;

        } catch (error) {
            console.error('Error en isCourtAvailable:', error.message);
            return false;
        }
    }
}

module.exports = BookingService;