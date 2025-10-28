import api from './api';

// Función para generar el link de pago para una reserva
const generatePaymentLink = async (bookingId) => {
  try {
    // Llamar a la ruta que crea la preferencia web
    const { data } = await api.post('/payments/create-booking-preference-qr', { bookingId });
    // data contendrá { init_point: "https://..." }
    return data;
  } catch (error) {
    console.error('Error generating payment link:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el link de pago');
  }
};

export const paymentService = {
  generatePaymentLink, // Renombramos la función para claridad
};
