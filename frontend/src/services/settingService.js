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

// --- NUEVA FUNCIÓN PÚBLICA ---
const getPublicBusinessHours = async () => {
  try {
    // Esta ruta la creamos en server/routes/settings.js y es pública
    const response = await apiClient.get('/settings/business-hours');
    return response.data;
  } catch (error) {
    console.error('Error fetching business hours:', error);
    throw error.response?.data || error;
  }
};
// ----------------------------

export const settingService = {
  getSettings,
  updateSettings,
  getPublicBusinessHours, // <-- Añadimos la nueva función a la exportación
};
