// frontend/src/services/paymentService.js
import api from './api';

export const paymentService = {
  /**
   * Genera un link de pago (Preferencia) para una reserva
   */
  generatePaymentLink: async (bookingId) => {
    try {
      const { data } = await api.post('/payments/create-booking-preference', { bookingId });
      return data;
    } catch (error) {
      console.error('Error generating payment link:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Error al generar link de pago');
    }
  },

  /**
   * Genera datos para un QR dinámico para una reserva
   */
  generateBookingQR: async (bookingId) => {
    try {
      const { data } = await api.post('/payments/create-booking-qr', { bookingId });
      return data;
    } catch (error) {
      console.error('Error generating booking QR:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Error al generar QR dinámico');
    }
  },

  // --- AÑADIR ESTA NUEVA FUNCIÓN ---
  /**
   * Genera datos para un QR dinámico para una venta en POS
   */
  generatePosQR: async (cart, totalAmount) => {
    try {
      const { data } = await api.post('/payments/create-pos-preference', { cart, totalAmount });
      return data;
    } catch (error) {
      console.error('Error generating POS QR:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Error al generar QR para POS');
    }
  },
  // ---------------------------------
};
