const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    getAllUsers, 
    deleteUser,
    updateUserRole,     // <-- Importar nuevo
    updateUserProfile   // <-- Importar nuevo
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');
const { handleValidationErrors } = require('../middlewares/validationMiddleware'); // <-- Importar
const { 
    registerUserValidators,
    updateUserRoleValidators,
    updateUserProfileValidators 
} = require('./validators/userValidators'); // <-- Importar

// @route   POST api/users/register
// @desc    Register a new user (by an admin)
// @access  Admin
router.post('/register', protect, admin, registerUserValidators, handleValidationErrors, registerUser);

// @route   GET api/users
// @desc    Get all users
// @access  Admin
router.get('/', protect, admin, getAllUsers);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/:id', protect, admin, deleteUser);

// --- NUEVAS RUTAS ---

// @route   PUT api/users/profile
// @desc    Update user (e.g., password)
// @access  Private (Self)
router.put('/profile', protect, updateUserProfileValidators, handleValidationErrors, updateUserProfile);

// @route   PUT api/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/:id/role', protect, admin, updateUserRoleValidators, handleValidationErrors, updateUserRole);


module.exports = router;
