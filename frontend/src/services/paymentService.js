import api from './api';

// Función para generar el QR dinámico para una reserva
const generateQR = async (bookingId) => {
  try {
    const { data } = await api.post('/payments/create-qr-order', { bookingId });
    // data contendrá { qr_data: "string_largo_del_qr" }
    return data;
  } catch (error) {
    console.error('Error generating QR:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Error al generar el QR');
  }
};

export const paymentService = {
  generateQR,
};
