// server/routes/settings.js (CORRECTED)
const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', getSettings);

// Rutas protegidas (Solo Admin)
router.put('/', protect, admin, updateSettings);

module.exports = router;
