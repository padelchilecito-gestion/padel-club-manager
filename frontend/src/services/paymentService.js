// frontend/src/services/paymentService.js (CORREGIDO Y UNIFICADO)
import api from './api';

/**
 * Crea una preferencia de pago UNIFICADA para QR.
 * Puede recibir un 'saleId' o un 'bookingId'.
 * @param {object} paymentData - { items, totalAmount, saleId, bookingId }
 */
export const createQrPayment = async (paymentData) => {
  try {
    // Llama a la nueva ruta unificada del backend
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
export const getPaymentStatus = async (paymentId) => {
  try {
    const { data } = await api.get(`/payments/status/${paymentId}`);
    return data;
  } catch (error) {
    console.error('Error al obtener el estado del pago:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al verificar pago');
  }
};

// ////////////////////////////////////////////////////////////////////
// LAS FUNCIONES ANTIGUAS YA NO SE USAN Y PUEDEN SER BORRADAS
// ////////////////////////////////////////////////////////////////////

// export const createPosPreference = async (saleData) => {
//   try {
//     const { data } = await api.post('/payments/create-pos-preference', saleData);
//     return data;
//   } catch (error) {
//     console.error('Error al crear la preferencia de POS:', error.response?.data);
//     throw new Error(error.response?.data?.message || 'Error al crear preferencia de POS');
//   }
// };