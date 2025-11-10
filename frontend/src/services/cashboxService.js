import apiClient from './api';

const getCurrentSession = async () => {
  try {
    const response = await apiClient.get('/cashbox/current');
    return response.data;
  } catch (error) {
    console.error('Error fetching current session:', error);
    throw error.response?.data || error;
  }
};

const getLastClosedSession = async () => {
  try {
    const response = await apiClient.get('/cashbox/last-closed');
    return response.data;
  } catch (error) {
    console.error('Error fetching last closed session:', error);
    throw error.response?.data || error;
  }
};

const startCashboxSession = async (startAmount) => {
  try {
    const response = await apiClient.post('/cashbox/start', { startAmount });
    return response.data;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error.response?.data || error;
  }
};

const closeCashboxSession = async (endAmount, notes) => {
    try {
      const response = await apiClient.post('/cashbox/close', { endAmount, notes });
      return response.data;
    } catch (error) {
      console.error('Error closing session:', error);
      throw error.response?.data || error;
    }
  };

export const cashboxService = {
  getCurrentSession,
  getLastClosedSession,
  startCashboxSession,
  closeCashboxSession,
};
