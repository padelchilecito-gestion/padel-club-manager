const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PendingSale = require('../models/PendingSale');
const PendingPayment = require('../models/PendingPayment');
const Court = require('../models/Court');
const BookingService = require('./booking-service');

class PaymentService {
    /**
     * Procesa una venta de punto de venta (POS) después de un pago aprobado.
     * @param {string} externalReference - El ID de la venta pendiente.
     * @param {object} io - La instancia de Socket.IO para emitir eventos.
     */
    static async processPosSale(externalReference, io) {
        const pendingSale = await PendingSale.findById(externalReference);
        if (!pendingSale) return null; // No es una venta de POS, o ya fue procesada

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const sale = new Sale({
                items: pendingSale.items,
                total: pendingSale.total,
                paymentMethod: 'MercadoPago'
            });
            await sale.save({ session });

            for (const item of pendingSale.items) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }, { session });
            }

            await PendingSale.findByIdAndDelete(externalReference, { session });

            await session.commitTransaction();

            // Emitir evento para notificar al frontend en tiempo real
            io.emit('pos_payment_success', { saleId: sale._id, pendingId: pendingSale._id });

            console.log(`Venta de POS procesada exitosamente para la referencia: ${externalReference}`);
            return sale;

        } catch (error) {
            await session.abortTransaction();
            console.error(`Error procesando la venta de POS para la referencia ${externalReference}:`, error);
            throw new Error(`Error al procesar la venta de POS: ${error.message}`);
        } finally {
            session.endSession();
        }
    }

    /**
     * Procesa un pago de reserva después de una notificación de pago aprobado.
     * @param {string} externalReference - El ID del pago pendiente.
     * @param {object} io - La instancia de Socket.IO para emitir eventos.
     */
    static async processBookingPayment(externalReference, io) {
        const pendingBooking = await PendingPayment.findById(externalReference);
        if (!pendingBooking) return null; // No es un pago de reserva, o ya fue procesado

        try {
            const court = await Court.findById(pendingBooking.court);
            if (!court) {
                throw new Error(`Cancha con ID ${pendingBooking.court} no encontrada.`);
            }

            const pricePerSlot = court.pricePerHour / 2; // Asume turnos de 30 min. Considera hacerlo más robusto.

            const bookingsToCreate = pendingBooking.slots.map(slot => {
                const startTime = new Date(pendingBooking.date);
                // OJO: Las horas se deben manejar en UTC para evitar problemas de zona horaria en el servidor.
                startTime.setUTCHours(slot.hour, slot.minute, 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000);

                return {
                    court: pendingBooking.court,
                    startTime,
                    endTime,
                    user: pendingBooking.user,
                    status: 'Confirmed',
                    isPaid: true,
                    paymentMethod: 'MercadoPago',
                    price: pricePerSlot,
                };
            });

            // Usamos el BookingService que ya maneja transacciones atómicas
            const createdBookings = await BookingService.createBulkBookings(bookingsToCreate);

            // Emitimos un solo evento bulk para notificar al frontend
            io.emit('booking_bulk_update', { type: 'created_bulk', bookings: createdBookings });

            await PendingPayment.findByIdAndDelete(externalReference);

            console.log(`Pago de reserva procesado exitosamente para la referencia: ${externalReference}`);
            return createdBookings;

        } catch (error) {
            console.error(`Error procesando el pago de reserva para la referencia ${externalReference}:`, error);
            throw new Error(`Error al procesar el pago de reserva: ${error.message}`);
        }
    }
}

module.exports = PaymentService;