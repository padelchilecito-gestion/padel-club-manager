import apiClient from './api';

const getAvailableTimeSlots = async (date) => {
  try {
    const response = await apiClient.get('/availability/slots', { params: { date } });
    return response.data;
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
};

const getAvailableCourts = async (date, time) => {
  try {
    const response = await apiClient.get('/availability/courts', { params: { date, time } });
    return response.data;
  } catch (error) {
    console.error('Error fetching available courts:', error);
    throw error;
  }
};

export const availabilityService = {
  getAvailableTimeSlots,
  getAvailableCourts,
};