import api from './api';

// Función para generar el QR dinámico para una reserva (usando Preferencia)
const generateQR = async (bookingId) => {
  try {
    // Llamar a la NUEVA ruta del backend
    const { data } = await api.post('/payments/create-booking-preference-qr', { bookingId });
    // data contendrá { qr_code_base64: "...", qr_code: "..." }
    return data;
  } catch (error) {
    console.error('Error generating Preference QR:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el QR');
  }
};

export const paymentService = {
  generateQR,
};
