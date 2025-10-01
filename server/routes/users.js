const express = require('express');
const router = express.Router();
const { registerUser, getAllUsers, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   POST api/users/register
// @desc    Register a new user (by an admin)
// @access  Admin
router.post('/register', protect, admin, registerUser);

// @route   GET api/users
// @desc    Get all users
// @access  Admin
router.get('/', protect, admin, getAllUsers);

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
