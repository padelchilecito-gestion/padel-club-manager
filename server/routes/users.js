// server/routes/users.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController'); // <-- Ya no importa 'getMe'

// --- INICIO DE LA CORRECCIÓN ---
// Importamos 'admin' en lugar de 'authorize'
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas protegidas (Solo Admin)
router.use(protect);
router.use(admin); // <-- Reemplaza 'authorize(['Admin'])'
// --- FIN DE LA CORRECCIÓN ---

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Ya no se usa la ruta '/me' aquí, se maneja en auth.js como '/profile'

module.exports = router;
