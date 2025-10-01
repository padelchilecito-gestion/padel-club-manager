import apiClient from './api';

const getLogs = async (page = 1, limit = 15) => {
  try {
    const response = await apiClient.get('/logs', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error.response?.data || error;
  }
};

export const logService = {
  getLogs,
};