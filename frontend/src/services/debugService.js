import apiClient from './api';

const resetDatabase = async () => {
  try {
    const response = await apiClient.delete('/debug/reset-database');
    return response.data;
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error.response?.data || error;
  }
};

export const debugService = {
  resetDatabase,
};