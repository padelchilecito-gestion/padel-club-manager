const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');

/**
 * Limpia un string para evitar la inyección de saltos de línea o caracteres maliciosos en los logs.
 * @param {string} str - El string a sanear.
 * @returns {string} - El string saneado.
 */
const sanitizeLog = (str) => {
  if (typeof str !== 'string') return str;
  // Reemplaza saltos de línea, tabulaciones y caracteres de control comunes con un espacio.
  return str.replace(/[\n\r\t\v\f]/g, ' ').trim();
};

// Middleware para registrar la actividad
const logActivity = (action, detailsCallback) => {
    return async (req, res, next) => {
        try {
            // Dejamos que la ruta principal se ejecute primero
            res.on('finish', async () => {
                // Solo registramos si la operación fue exitosa (códigos 2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const token = req.header('Authorization')?.split(' ')[1];
                    if (!token) return;

                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    
                    // Se sanean los detalles antes de guardarlos
                    const details = sanitizeLog(detailsCallback(req, res));

                    const log = new ActivityLog({
                        user: {
                            id: decoded.id,
                            username: decoded.username // Necesitaremos añadir username al token
                        },
                        action,
                        details
                    });
                    await log.save();
                }
            });
        } catch (error) {
            console.error('Error al registrar actividad:', error);
        }
        next();
    };
};

module.exports = logActivity;