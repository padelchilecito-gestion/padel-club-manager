// server/routes/users.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware'); // <-- CORREGIDO

// Rutas protegidas (Solo Admin)
router.use(protect);
router.use(admin); // <-- CORREGIDO

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
