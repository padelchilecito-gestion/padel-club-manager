// frontend/src/services/settingService.js
import api from './api';

// CORRECCIÓN: Quitamos /api de esta URL, porque api.js ya lo incluye en la baseURL.
const SETTING_API_URL = '/settings'; 

/**
 * Obtiene todas las configuraciones del sistema.
 * @returns {Promise<object>} Un objeto con las configuraciones (ej. { "SLOT_DURATION": "60", "CLUB_WHATSAPP": "+54911..." }).
 */
const getSettings = async () => {
    try {
        const response = await api.get(SETTING_API_URL);
        // Transformar el array de objetos a un objeto { key: value } para fácil acceso
        const settingsMap = response.data.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        return settingsMap;
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al obtener la configuración';
        throw new Error(message);
    }
};

const settingService = {
    getSettings,
    // Puedes añadir otras funciones como updateSetting si las tienes
};

export default settingService;
