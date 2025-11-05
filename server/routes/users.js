// server/routes/users.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // --- CORRECCIÓN DE NOMBRES (a los originales) ---
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(admin);

router.route('/')
  // --- CORRECCIÓN DE NOMBRES ---
  .get(getUsers); // <-- Esta era la línea 18

router.route('/:id')
  .get(getUserById)
  // --- CORRECCIÓN DE NOMBRES ---
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
