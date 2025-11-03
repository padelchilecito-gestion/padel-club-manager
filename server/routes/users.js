// server/routes/users.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController'); // <-- CORREGIDO: No se importa 'getMe'

// --- INICIO DE LA CORRECCIÓN ---
// Importamos 'admin' en lugar de 'authorize'
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas protegidas (Solo Admin)
router.use(protect);
router.use(admin); // <-- CORREGIDO: Reemplaza 'authorize(['Admin'])'
// --- FIN DE LA CORRECCIÓN ---

router.route('/')
  .get(getUsers); // <-- Esta línea (que era la 21) ya no tendrá el error

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Se elimina la ruta '/me' porque se maneja en auth.js como '/profile'

module.exports = router;
