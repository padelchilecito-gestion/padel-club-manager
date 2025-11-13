import apiClient from './api';

const createRecurringBooking = async (data) => {
  try {
    const response = await apiClient.post('/recurring-bookings', data);
    return response.data;
  } catch (error) {
    console.error('Error creating recurring booking:', error);
    throw error.response?.data || error;
  }
};

const getRecurringBookings = async () => {
  try {
    const response = await apiClient.get('/recurring-bookings');
    return response.data;
  } catch (error) {
    console.error('Error fetching recurring bookings:', error);
    throw error.response?.data || error;
  }
};

const toggleRecurringBooking = async (id) => {
  try {
    const response = await apiClient.put(`/recurring-bookings/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling recurring booking:', error);
    throw error.response?.data || error;
  }
};

const updateRecurringBooking = async (id, data) => {
  try {
    const response = await apiClient.put(`/recurring-bookings/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating recurring booking:', error);
    throw error.response?.data || error;
  }
};

const deleteRecurringBooking = async (id) => {
  try {
    const response = await apiClient.delete(`/recurring-bookings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting recurring booking:', error);
    throw error.response?.data || error;
  }
};

export const recurringBookingService = {
  createRecurringBooking,
  getRecurringBookings,
  toggleRecurringBooking,
  updateRecurringBooking,
  deleteRecurringBooking,
};
