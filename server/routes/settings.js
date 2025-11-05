// server/routes/settings.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware'); // Se importa 'admin'

// Ruta pública
router.get('/', getSettings);

// Ruta protegida (Solo Admin)
router.put('/', protect, admin, updateSettings); // Se usa 'admin'

module.exports = router;
