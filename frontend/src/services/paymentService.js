import api from './api';

// --- Función para generar QR dinámico de Reserva ---
const generateBookingQR = async (bookingId) => {
  try {
    // Llama a la NUEVA ruta del backend
    const { data } = await api.post('/payments/create-booking-qr', { bookingId });
    // data contendrá { qr_data: "string_EMVCo...", amount: XXX }
    console.log("Servicio: QR data recibida del backend", data); // Log para debug
    return data; 
  } catch (error) {
    console.error('Error en service/generateBookingQR:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el QR de pago');
  }
};

// --- Función para link de pago (la dejamos por si acaso) ---
const generatePaymentLink = async (bookingId) => {
  try {
    const { data } = await api.post('/payments/create-booking-preference-qr', { bookingId }); // Ruta anterior
    return data; // { init_point: "https://" }
  } catch (error) { /* ... */ }
};

export const paymentService = {
  generateBookingQR,      // La que usaremos
  generatePaymentLink,    // Opcional
};
