// server/routes/users.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // Se usan los nombres exactos de tu controlador
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(admin); // Se usa el middleware correcto

router.route('/')
  .get(getUsers); // Se usa el nombre de función correcto

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
