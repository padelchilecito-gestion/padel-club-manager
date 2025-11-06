// frontend/src/services/bookingService.js (CORREGIDO)
import api from './api'; // Tu instancia de axios configurada
import axios from 'axios'; // Usamos axios directamente para MercadoPago porque puede no requerir token

const BOOKING_API_URL = '/api/bookings';

/**
 * Crea una reserva con pago en efectivo.
 */
const createCashBooking = async (bookingData) => {
    try {
        const response = await api.post(`${BOOKING_API_URL}/cash`, bookingData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al crear la reserva en efectivo';
        throw new Error(message);
    }
};

/**
 * Inicia el proceso de pago con Mercado Pago para una reserva.
 */
const createMercadoPagoBooking = async (bookingData) => {
    try {
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

// --- INICIO DE LAS CORRECCIONES ---

/**
 * Obtiene todas las reservas (o las del usuario).
 * @returns {Promise<Array>} Lista de reservas.
 */
const getBookings = async () => {
    try {
        // La ruta '/mybookings' o '/' se maneja en el backend basado en el rol
        const response = await api.get(BOOKING_API_URL);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al obtener las reservas';
        throw new Error(message);
    }
};

/**
 * Obtiene una reserva por su ID.
 * @param {string} bookingId - El ID de la reserva.
 * @returns {Promise<object>} La reserva.
 */
const getBookingById = async (bookingId) => {
    try {
        const response = await api.get(`${BOOKING_API_URL}/${bookingId}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al obtener la reserva';
        throw new Error(message);
    }
};

/**
 * Actualiza una reserva.
 * @param {string} bookingId - El ID de la reserva.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} La reserva actualizada.
 */
const updateBooking = async (bookingId, updateData) => {
    try {
        const response = await api.put(`${BOOKING_API_URL}/${bookingId}`, updateData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al actualizar la reserva';
        throw new Error(message);
    }
};

/**
 * Elimina una reserva.
 * @param {string} bookingId - El ID de la reserva.
 * @returns {Promise<object>} Mensaje de éxito.
 */
const deleteBooking = async (bookingId) => {
    try {
        const response = await api.delete(`${BOOKING_API_URL}/${bookingId}`);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al eliminar la reserva';
        throw new Error(message);
    }
};

const bookingService = {
    createCashBooking,
    createMercadoPagoBooking,
    getBookings, // <-- Añadido
    getBookingById, // <-- Añadido
    updateBooking, // <-- Añadido
    deleteBooking, // <-- Añadido
};

// --- FIN DE LAS CORRECCIONES ---

export default bookingService;
