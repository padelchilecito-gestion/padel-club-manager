// server/routes/auth.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);

router.get('/check', protect, authController.checkAuthStatus);

router.route('/profile')
  .get(protect, authController.getUserProfile)
  .put(protect, authController.updateUserProfile);

module.exports = router;
