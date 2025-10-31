// frontend/src/services/settingService.js
import api from './api';

const SETTING_API_URL = '/settings';

/**
 * Obtiene todas las configuraciones del sistema.
 * @returns {Promise<object>} La respuesta completa de Axios.
 */
// 1. Exportación "Nombrada" (para SettingsPage.jsx)
export const getSettings = async () => {
    try {
        const response = await api.get(SETTING_API_URL);
        // Devolvemos la respuesta completa de axios
        return response;

    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al obtener la configuración';
        throw new Error(message);
    }
};

/**
 * Actualiza TODAS las configuraciones del sistema.
 * @param {object} settingsData El objeto con las configuraciones a guardar.
 * @returns {Promise<object>} La respuesta completa de Axios.
 */
// 2. Exportación "Nombrada" (para SettingsPage.jsx)
export const updateSettings = async (settingsData) => {
    try {
        // Usamos PUT para reemplazar/actualizar el objeto de configuración
        const response = await api.put(SETTING_API_URL, settingsData);
        return response; // Devolvemos la respuesta completa
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Error al actualizar la configuración';
        throw new Error(message);
    }
};

// 3. Creamos un objeto que contenga las funciones
const settingService = {
    getSettings,
    updateSettings,
};

// 4. Exportación "Default" (para PublicLayout.jsx)
export default settingService;
