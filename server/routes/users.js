const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');
// const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public (or Admin in the future)
router.post('/register', registerUser);

// Future routes for user management (protected)
// router.get('/', protect, admin, getAllUsers);
// router.delete('/:id', protect, admin, deleteUser);

module.exports = router;