// server/routes/users.js (DIAGNOSTIC IMPORT FIX)
const express = require('express');
const router = express.Router();
// --- FIX: Import the entire controller object ---
const userController = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(admin);

router.route('/')
  // --- FIX: Use the controller object to access the function ---
  .get(userController.getUsers);

router.route('/:id')
  // --- FIX: Use the controller object to access functions ---
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
