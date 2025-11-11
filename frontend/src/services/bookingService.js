import apiClient from './api';

const getAvailability = async (courtId, date) => {
  try {
    const response = await apiClient.get('/bookings/availability', {
      params: { courtId, date },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }
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

// (createPaymentPreference fue movido a paymentService.js)

const getAllBookings = async () => {
    try {
        const response = await apiClient.get('/bookings');
        return response.data;
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        throw error;
    }
};

const updateBookingStatus = async (id, statusData) => {
    try {
        const response = await apiClient.put(`/bookings/${id}/status`, statusData);
        return response.data;
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error.response?.data || error;
    }
};

const cancelBooking = async (id) => {
    try {
        const response = await apiClient.put(`/bookings/${id}/cancel`);
        return response.data;
    } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error.response?.data || error;
    }
}

// --- NUEVAS FUNCIONES PÚBLICAS ---

const getPublicAvailabilitySlots = async (date) => {
  try {
    // 'date' debe ser un string 'yyyy-MM-dd'
    const response = await apiClient.get('/bookings/public-slots', {
      params: { date },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching public slots:', error);
    throw error.response?.data || error;
  }
};

const getPublicCourtOptions = async (startTime, endTime) => {
  try {
    const response = await apiClient.get('/bookings/public-options', {
      params: { startTime, endTime },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching court options:', error);
    throw error.response?.data || error;
  }
};
// --------------------------------

export const bookingService = {
  getAvailability, // (Esta ya no la usará el TimeSlotFinder, pero la dejamos)
  createBooking,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  // --- AÑADIMOS LAS NUEVAS FUNCIONES ---
  getPublicAvailabilitySlots,
  getPublicCourtOptions,
};
