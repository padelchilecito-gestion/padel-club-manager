// server/validators/cashboxValidator.js
const { body } = require('express-validator');

const validateMovement = [
  body('type')
    .isIn(['Ingreso', 'Egreso'])
    .withMessage("El tipo de movimiento debe ser 'Ingreso' o 'Egreso'."),

  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('El monto debe ser un número positivo.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria.')
    .isLength({ max: 100 })
    .withMessage('La descripción no puede tener más de 100 caracteres.'),
];

module.exports = {
  validateMovement,
};
