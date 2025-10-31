const express = require('express');
const {
  loginUser, // <-- Corregido de 'authUser'
  logoutUser,
  getUserProfile,
  updateUserProfile,
  checkAuthStatus
} = require('../controllers/authController.js'); // <-- Convertido a 'require'
const { protect } = require('../middlewares/authMiddleware.js'); // <-- Convertido a 'require'

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/status', protect, checkAuthStatus); 

module.exports = router; // <-- Convertido a 'module.exports'
