// frontend/src/services/settingService.js
import api from './api';

const SETTING_API_URL = '/settings';

/**
 * Obtiene todas las configuraciones del sistema.
 * @returns {Promise<object>} La respuesta completa de Axios.
 */
// Exportamos con 'export const' para que coincida con el import de SettingsPage.jsx
export const getSettings = async () => {
    try {
        const response = await api.get(SETTING_API_URL);
        
        // SettingsPage.jsx espera la respuesta completa de axios 
        // para desestructurar 'data' (const { data } = await getSettings())
        // Así que devolvemos la respuesta completa.
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
// ESTA FUNCIÓN FALTABA. La añadimos y la exportamos.
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

// Ya no necesitamos un 'export default'
