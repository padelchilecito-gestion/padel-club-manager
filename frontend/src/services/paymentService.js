// frontend/src/services/paymentService.js - SERVICIO COMPLETO
import api from './api';

/**
 * Genera QR dinámico para cobrar en persona
 * @param {string} bookingId - ID de la reserva
 * @returns {Promise<{qr_data: string, amount: number}>}
 */
const generateBookingQR = async (bookingId) => {
  try {
    const { data } = await api.post('/payments/create-booking-qr', { bookingId });
    console.log("✅ QR data recibida:", data);
    return data;
  } catch (error) {
    console.error('❌ Error generando QR:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el QR de pago');
  }
};

/**
 * Genera link de pago web (Checkout Pro)
 * @param {string} bookingId - ID de la reserva
 * @returns {Promise<{id: string, init_point: string}>}
 */
const generatePaymentLink = async (bookingId) => {
  try {
    const { data } = await api.post('/payments/create-preference', { bookingId });
    console.log("✅ Link de pago recibido:", data);
    return data;
  } catch (error) {
    console.error('❌ Error generando link:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el link de pago');
  }
};

export const paymentService = {
  generateBookingQR,
  generatePaymentLink
};
