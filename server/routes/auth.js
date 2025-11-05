// server/routes/auth.js (CORRECTED)
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  // --- CORRECCIÓN ---
  // Se elimina 'checkAuthStatus' porque no existe en el controlador
} = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // Ruta para cerrar sesión

// Rutas protegidas (requieren token)

// --- INICIO DE LA CORRECCIÓN ---
// La ruta '/check' ahora usa el middleware 'protect' y
// simplemente devuelve el 'req.user' que 'protect' ya encontró.
// Esto es más eficiente (1 consulta a la BD en lugar de 2) y soluciona el error.
router.get('/check', protect, (req, res) => {
  res.json(req.user);
});
// --- FIN DE LA CORRECCIÓN ---

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
