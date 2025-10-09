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
};

const getAllBookingsAdmin = async (page = 1, limit = 10, filters = {}) => {
    const params = { page, limit, ...filters };
    const response = await apiClient.get('/bookings/admin', { params });
    return response.data;
};

export const bookingService = {
  getAvailability,
  createBooking,
  createPaymentPreference,
  getAllBookings,
  getAllBookingsAdmin,
  updateBookingStatus,
  cancelBooking,
};
