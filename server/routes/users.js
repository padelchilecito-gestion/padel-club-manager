// server/routes/users.js (CORRECTED)
const express = require('express');
const router = express.Router();
const {
  // --- CORRECCIÓN DE NOMBRES ---
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(admin);

router.route('/')
  // --- CORRECCIÓN DE NOMBRES ---
  .get(getAllUsers);

router.route('/:id')
  .get(getUserById)
  // --- CORRECCIÓN DE NOMBRES ---
  .put(updateUserById)
  .delete(deleteUserById);

module.exports = router;
