const express = require('express');
const router = express.Router();
const { authUser } = require('../controllers/authController');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authUser);

module.exports = router;