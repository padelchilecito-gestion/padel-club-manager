import express from 'express';
import {
  loginUser, // <-- CAMBIADO DE 'authUser' A 'loginUser'
  logoutUser,
  getUserProfile,
  updateUserProfile,
  checkAuthStatus
} from '../controllers/authController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser); // <-- La función importada ahora coincide
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/status', protect, checkAuthStatus); // 'protect' aquí verifica el token

export default router;
