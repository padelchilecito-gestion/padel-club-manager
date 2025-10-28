import api from './api';

// --- FUNCIÓN ACTUALIZADA para llamar a la nueva ruta del QR dinámico ---
const generateBookingQR = async (bookingId) => {
  try {
    // Llama a la nueva ruta del backend que usa la API QR simplificada
    const { data } = await api.post('/payments/create-booking-qr', { bookingId });
    // data ahora contendrá { qr_data: "00020101...", amount: 1000 }
    return data; 
  } catch (error) {
    console.error('Error generating booking QR:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el QR de pago');
  }
};

// --- Función para link de pago (la dejamos por si acaso, pero no la usaremos en el modal QR) ---
const generatePaymentLink = async (bookingId) => {
  try {
    // Esta ruta puede que ya no exista o la hayamos comentado en el backend
    const { data } = await api.post('/payments/create-booking-preference-qr', { bookingId });
    return data; // { init_point: "https://" }
  } catch (error) {
    console.error('Error generating payment link:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el link de pago');
  }
};


export const paymentService = {
  generateBookingQR,      // La que usará el modal QR
  generatePaymentLink,    // La dejamos por compatibilidad o futuro uso
  // generateSaleQR,      // Comentada - No implementamos QR de POS ahora
};
