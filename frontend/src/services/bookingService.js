import apiClient from './api';

const getAvailability = async (courtId, date) => {
  // ... (código existente) ...
};

const createBooking = async (bookingData) => {
  try {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error.response?.data || error;
  }
};

const getBookings = async (params) => {
    // ... (código existente) ...
};

const updateBookingStatus = async (id, statusData) => {
    // ... (código existente) ...
};

const cancelBooking = async (id) => {
    // ... (código existente) ...
}

const getPublicAvailabilitySlots = async (date) => {
  // ... (código existente) ...
};

const getPublicCourtOptions = async (startTime, endTime) => {
  // ... (código existente) ...
};

// --- NUEVAS FUNCIONES AÑADIDAS ---

const createRecurringBooking = async (bookingData, weeks) => {
  try {
    // Enviamos el "template" y el número de semanas
    const response = await apiClient.post('/bookings/recurring', { bookingData, weeks });
    return response.data;
  } catch (error) {
    console.error('Error creating recurring booking:', error);
    throw error.response?.data || error;
  }
};

const deleteRecurringBooking = async (groupId) => {
  try {
    const response = await apiClient.delete(`/bookings/recurring/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting recurring booking:', error);
    throw error.response?.data || error;
  }
};
// ---------------------------------

export const bookingService = {
  getAvailability, 
  createBooking,
  getBookings, 
  updateBookingStatus,
  cancelBooking,
  getPublicAvailabilitySlots,
  getPublicCourtOptions,
  // --- EXPORTAR NUEVAS FUNCIONES ---
  createRecurringBooking,
  deleteRecurringBooking,
  // ---------------------------------
};
