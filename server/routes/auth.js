const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  checkAuthStatus,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas Públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Rutas Privadas (requieren un token válido)
router.get('/check', protect, checkAuthStatus);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
