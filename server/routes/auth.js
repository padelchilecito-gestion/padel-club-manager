// server/routes/auth.js (CORRECTED)
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  checkAuthStatus,
} = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // Ruta para cerrar sesión

// Rutas protegidas (requieren token)
router.get('/check', protect, checkAuthStatus); // Ruta para verificar token

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
