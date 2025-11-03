// server/routes/auth.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,       // <-- Añadido
  checkAuthStatus,  // <-- Añadido
} = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // <-- Ruta añadida

// Rutas protegidas (requieren token)
router.get('/check', protect, checkAuthStatus); // <-- Ruta añadida

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile); // <-- Esta línea ya no dará error

module.exports = router;
