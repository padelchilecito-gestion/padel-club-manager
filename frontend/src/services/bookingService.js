// frontend/src/services/bookingService.js
import api from './api'; // Tu instancia de axios configurada
import axios from 'axios'; // Usamos axios directamente para MercadoPago porque puede no requerir token

const BOOKING_API_URL = '/api/bookings'; // Asegúrate de que esta URL sea correcta

/**
 * Crea una reserva con pago en efectivo.
 * @param {object} bookingData - Datos de la reserva (date, time, clientName, clientPhone, etc.).
 * @returns {Promise<object>} Los datos de la reserva creada.
 */
const createCashBooking = async (bookingData) => {
    try {
        // Asegúrate de que tu backend tenga un endpoint POST /api/bookings/cash
        const response = await api.post(`${BOOKING_API_URL}/cash`, bookingData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al crear la reserva en efectivo';
        throw new Error(message);
    }
};

/**
 * Inicia el proceso de pago con Mercado Pago para una reserva.
 * @param {object} bookingData - Datos de la reserva necesarios para generar la preferencia.
 * @returns {Promise<string>} La URL de redirección de Mercado Pago.
 */
const createMercadoPagoBooking = async (bookingData) => {
    try {
        // Asegúrate de que tu backend tenga un endpoint POST /api/bookings/mercadopago
        // Este endpoint devolverá la URL de redirección
        const response = await api.post(`${BOOKING_API_URL}/mercadopago`, bookingData);
        if (response.data && response.data.init_point) {
            return response.data.init_point; // URL de Mercado Pago
        } else {
            throw new Error('No se recibió la URL de Mercado Pago.');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al iniciar pago con Mercado Pago';
        throw new Error(message);
    }
};

const bookingService = {
    createCashBooking,
    createMercadoPagoBooking,
};

export default bookingService;
