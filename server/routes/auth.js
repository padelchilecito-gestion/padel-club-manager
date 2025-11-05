// server/routes/auth.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  // Se elimina 'checkAuthStatus' porque no existe en el controlador
} = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Rutas protegidas (requieren token)

// La ruta '/check' usa 'protect' y devuelve el 'req.user' que 'protect' ya encontró.
// Esto soluciona el error 500 y es más eficiente.
router.get('/check', protect, (req, res) => {
  res.json(req.user);
});

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
