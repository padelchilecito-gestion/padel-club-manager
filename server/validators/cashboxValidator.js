// server/validators/cashboxValidator.js
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

// Renamed from validateStartSession for clarity and consistency
const validateCashboxStart = [
  body('startAmount')
    .exists({ checkFalsy: true })
    .withMessage('El monto inicial (startAmount) es requerido.')
    .isFloat({ min: 0 })
    .withMessage('El monto inicial debe ser un número mayor o igual a cero.'),
  handleValidationErrors, // Use the reusable handler
];

// Added the missing validator based on user's request
const validateMovement = [
  body('type')
    .isIn(['IN', 'OUT'])
    .withMessage("El tipo de movimiento debe ser 'IN' o 'OUT'."),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('El monto debe ser un número positivo.'),
  body('description')
    .notEmpty()
    .withMessage('La descripción es requerida.'),
  handleValidationErrors, // Use the reusable handler
];

module.exports = {
  validateCashboxStart,
  validateMovement,
};
