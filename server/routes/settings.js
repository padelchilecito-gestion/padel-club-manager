const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Ruta Pública para que el frontend pueda obtener la configuración
router.get('/', getSettings);

// Ruta Privada solo para Admins para actualizar la configuración
router.put('/', protect, admin, updateSettings);

module.exports = router;
