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
    throw error;
  }
};

const createPaymentPreference = async (paymentData) => {
    try {
        const response = await apiClient.post('/payments/create-preference', paymentData);
        return response.data;
    } catch (error) {
        console.error('Error creating payment preference:', error);
        throw error;
    }
};


export const bookingService = {
  getAvailability,
  createBooking,
  createPaymentPreference,
};