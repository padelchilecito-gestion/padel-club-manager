// frontend/src/services/paymentService.js (CORREGIDO)
import api from './api';

/**
 * Crea una preferencia de pago UNIFICADA para QR.
 * Puede recibir un 'saleId' o un 'bookingId'.
 * @param {object} paymentData - { items, totalAmount, saleId, bookingId }
 */
const createQrPayment = async (paymentData) => {
  try {
    // Llama a la ruta unificada del backend
    const { data } = await api.post('/payments/create-qr', paymentData);
    return data;
  } catch (error) {
    console.error('Error al crear la preferencia de pago QR:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al crear QR');
  }
};

/**
 * Obtiene el estado de un pago desde MercadoPago.
 * @param {string} paymentId - El ID del pago de MP
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const { data } = await api.get(`/payments/status/${paymentId}`);
    return data;
  } catch (error) {
    console.error('Error al obtener el estado del pago:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al verificar pago');
  }
};

// --- INICIO DE LA CORRECCIÓN ---
// Exportamos un objeto como 'default' para que la importación
// 'import paymentService from ...' funcione en los componentes.
export default {
  createQrPayment,
  getPaymentStatus,
};
// --- FIN DE LA CORRECCIÓN ---