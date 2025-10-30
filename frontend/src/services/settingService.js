// frontend/src/services/settingService.js
import api from './api';

const SETTING_API_URL = '/settings'; // Esto ya está correcto

/**
 * Obtiene todas las configuraciones del sistema.
 * @returns {Promise<object>} Un objeto con las configuraciones (ej. { "SLOT_DURATION": "60", "CLUB_WHATSAPP": "+54911..." }).
 */
const getSettings = async () => {
    try {
        const response = await api.get(SETTING_API_URL);
        
        // CORRECCIÓN:
        // El error "...data.reduce is not a function" indica que la API (response.data)
        // no está devolviendo un Array, sino que probablemente ya devuelve el objeto 
        // de configuraciones (settingsMap) directamente.
        //
        // Por lo tanto, eliminamos la transformación .reduce() y devolvemos los datos tal cual.

        /* CÓDIGO ANTIGUO (CAUSABA EL ERROR)
        const settingsMap = response.data.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        return settingsMap;
        */

        // CÓDIGO NUEVO:
        // Si la API ya devuelve el objeto { key: value }, simplemente lo retornamos.
        return response.data;

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
