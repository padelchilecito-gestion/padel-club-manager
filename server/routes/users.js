// server/routes/users.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile // <-- CORRECCIÓN 1: Importar getUserProfile
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

// CORRECCIÓN 2: Añadir la ruta /profile
// Esta ruta debe ir ANTES de la ruta '/:id'
router.route('/profile')
  .get(protect, getUserProfile); // GET /api/users/profile

router.route('/')
  .post(registerUser) // POST /api/users
  .get(protect, admin, getAllUsers); // GET /api/users

router.route('/:id')
  .get(protect, getUserById)      // GET /api/users/:id
  .put(protect, updateUser)       // PUT /api/users/:id
  .delete(protect, admin, deleteUser); // DELETE /api/users/:id

module.exports = router;
