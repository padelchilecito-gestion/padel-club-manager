const axios = require('axios');
const Settings = require('../models/Settings');

// A futuro, estas podrían ser variables de entorno
const WPP_API_URL = process.env.WPP_API_URL; // E.g., 'https://graph.facebook.com/v18.0/...'
const WPP_ACCESS_TOKEN = process.env.WPP_ACCESS_TOKEN; // Token de acceso de la API
const WPP_PHONE_NUMBER_ID = process.env.WPP_PHONE_NUMBER_ID; // ID del número de teléfono de la empresa

/**
 * Servicio para gestionar el envío de notificaciones
 */
class NotificationService {

    /**
     * Obtiene la configuración principal de la aplicación
     * @returns {Promise<Object|null>}
     */
    static async getSettings() {
        try {
            return await Settings.findOne({ configKey: "main_settings" });
        } catch (error) {
            console.error("Error al obtener la configuración:", error);
            return null;
        }
    }

    /**
     * Obtiene el número de WhatsApp del administrador desde la configuración
     * @returns {Promise<string|null>}
     */
    static async getAdminWppNumber() {
        const settings = await this.getSettings();
        return settings ? settings.whatsappNumber : null;
    }

    /**
     * Envía un mensaje de WhatsApp a través de la API oficial de Meta.
     * @param {string} to - Número de teléfono del destinatario (formato internacional, ej: 5491123456789)
     * @param {string} message - Contenido del mensaje.
     * @returns {Promise<boolean>} - true si el mensaje se envió con éxito, false en caso contrario.
     */
    static async sendWhatsAppMessage(to, message) {
        // Validaciones de pre-requisitos
        if (!WPP_API_URL || !WPP_ACCESS_TOKEN || !WPP_PHONE_NUMBER_ID) {
            console.error("Faltan variables de entorno críticas para enviar WhatsApp. El mensaje no será enviado.");
            console.log(`Mensaje no enviado a ${to}: ${message}`);
            return false; // No continuar si la configuración básica no está
        }

        if (!to || !message) {
            console.error("Número de destinatario o mensaje no proporcionado.");
            return false;
        }

        // Limpiar y formatear el número de teléfono
        const formattedTo = to.replace(/\D/g, '');
        if (formattedTo.length < 10) {
            console.error(`Número de teléfono inválido: ${to}`);
            return false;
        }

        // --- Simulación (si no hay credenciales) ---
        // Para desarrollo, si no se configuran las variables, simulamos el envío.
        if (process.env.NODE_ENV !== 'production' && (!WPP_API_URL || !WPP_ACCESS_TOKEN)) {
            console.log("--- SIMULACIÓN DE WHATSAPP ---");
            console.log(`Destinatario: ${formattedTo}`);
            console.log(`Mensaje: ${message}`);
            console.log("-------------------------------");
            return true;
        }


        // --- Envío Real (requiere configuración) ---
        const payload = {
            messaging_product: "whatsapp",
            to: formattedTo,
            type: "text",
            text: {
                preview_url: false,
                body: message
            }
        };

        const headers = {
            'Authorization': `Bearer ${WPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.post(`${WPP_API_URL}/${WPP_PHONE_NUMBER_ID}/messages`, payload, { headers });
            console.log(`Mensaje de WhatsApp enviado exitosamente a ${formattedTo}. Message ID: ${response.data.messages[0].id}`);
            return true;
        } catch (error) {
            console.error(`Error al enviar mensaje de WhatsApp a ${formattedTo}:`, error.response ? error.response.data : error.message);
            return false;
        }
    }
}

module.exports = NotificationService;