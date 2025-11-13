const { body, param } = require('express-validator');

const registerUserValidators = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required.')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('role')
        .isIn(['Admin', 'Operator']).withMessage('Invalid role.')
];

const updateUserRoleValidators = [
    param('id').isMongoId().withMessage('Invalid user ID.'),
    body('role')
        .isIn(['Admin', 'Operator']).withMessage('Invalid role.')
];

const updateUserProfileValidators = [
    body('oldPassword')
        .notEmpty().withMessage('Old password is required.'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long.')
];

module.exports = {
    registerUserValidators,
    updateUserRoleValidators,
    updateUserProfileValidators
};
