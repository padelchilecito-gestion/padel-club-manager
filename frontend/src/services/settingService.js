import apiClient from './api';

const getSettings = async () => {
  try {
    const response = await apiClient.get('/settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error.response?.data || error;
  }
};

const updateSettings = async (settingsData) => {
  try {
    const response = await apiClient.put('/settings', settingsData);
    return response.data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error.response?.data || error;
  }
};

export const settingService = {
  getSettings,
  updateSettings,
};
