// server/routes/settings.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware'); // <-- CORREGIDO

// Rutas públicas
router.get('/', getSettings);

// Rutas protegidas (Solo Admin)
router.put('/', protect, admin, updateSettings); // <-- CORREGIDO

module.exports = router;
