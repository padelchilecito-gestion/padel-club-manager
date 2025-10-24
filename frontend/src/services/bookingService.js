import apiClient from './api';

const getAvailability = async (date) => {
  try {
    // The new endpoint expects just a date
    const response = await apiClient.get('/bookings/availability', {
      params: { date },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw error.response?.data || error;
  }
};

const createBooking = async ({ date, slots, userName, userPhone, paymentMethod }) => {
  try {
    // The new endpoint expects this specific payload
    const bookingData = { date, slots, userName, userPhone, paymentMethod };
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error.response?.data || error;
  }
};

const createPaymentPreference = async (paymentData) => {
    try {
        const response = await apiClient.post('/payments/create-preference', paymentData);
        return response.data;
    } catch (error) {
        console.error('Error creating payment preference:', error);
        throw error.response?.data || error;
    }
};

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

export const bookingService = {
  getAvailability,
  createBooking,
  createPaymentPreference,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
};
