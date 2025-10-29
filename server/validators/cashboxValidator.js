// server/validators/cashboxValidator.js - ARCHIVO NUEVO
const { body, validationResult } = require('express-validator');

// Middleware de validación para iniciar sesión de caja
const validateStartSession = [
  // 1. Validar que 'startAmount' existe, es numérico y no es negativo
  body('startAmount')
    .exists({ checkFalsy: true }).withMessage('El monto inicial (startAmount) es requerido.') // checkFalsy considera 0 como válido
    .isFloat({ min: 0 }).withMessage('El monto inicial debe ser un número mayor o igual a cero.'),

  // 2. Middleware para manejar los errores de validación
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Si hay errores, devolver un 400 con los detalles
      return res.status(400).json({ errors: errors.array() });
    }
    // Si no hay errores, continuar con el siguiente middleware (el controlador)
    next();
  }
];

module.exports = {
  validateStartSession
};
