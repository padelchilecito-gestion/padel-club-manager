const express = require('express');
const router = express.Router();
const { 
  getSettings, 
  updateSettings,
  getPublicBusinessHours // --- IMPORTADO ---
} = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- NUEVA RUTA PÚBLICA ---
// @route   GET api/settings/business-hours
// @desc    Get business hours for public booking page
// @access  Public
router.get('/business-hours', getPublicBusinessHours);
// -------------------------

// @route   GET api/settings
// @desc    Get all settings
// @access  Admin
router.get('/', protect, admin, getSettings);

// @route   PUT api/settings
// @desc    Update settings
// @access  Admin
router.put('/', protect, admin, updateSettings);

module.exports = router;
