const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');

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
                    
                    const details = detailsCallback(req, res);

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