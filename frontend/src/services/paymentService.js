// frontend/src/services/paymentService.js (CORREGIDO)
import api from './api';

const PAYMENT_API_URL = '/api/payments';

/**
 * Crea una preferencia de pago para una RESERVA.
 */
const createMercadoPagoPreference = async (bookingData) => {
  try {
    const { data } = await api.post(`${PAYMENT_API_URL}/create-preference`, bookingData);
    return data; // Devuelve { init_point, preferenceId }
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Obtiene el estado de un pago.
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const { data } = await api.get(`${PAYMENT_API_URL}/status/${paymentId}`);
    return data; // Devuelve el estado del pago
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

// --- INICIO DE LA CORRECCIÓN ---
/**
 * Crea una preferencia de pago para el POS (Punto de Venta).
 * @param {object} posData - { items, totalAmount, saleId }
 * @returns {Promise<object>} { init_point, preferenceId }
 */
const generatePosQR = async (posData) => {
  try {
    // Llama a la nueva ruta del backend
    const { data } = await api.post(`${PAYMENT_API_URL}/create-pos-preference`, posData);
    return data;
  } catch (error) {
    console.error('Error en generatePosQR service:', error);
    throw new Error(error.response?.data?.message || 'Error al generar QR para POS');
  }
};
// --- FIN DE LA CORRECCIÓN ---

const paymentService = {
  createMercadoPagoPreference,
  getPaymentStatus,
  generatePosQR, // <-- Exportar la nueva función
};

export default paymentService;
