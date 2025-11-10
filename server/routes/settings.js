const express = require('express');
const router = express.Router();
const { 
  getSettings, 
  updateSettings,
  getPublicSettings // --- IMPORTADO ---
} = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- RUTA PÚBLICA MODIFICADA ---
// @route   GET api/settings/public
// @desc    Get public settings (shop status, business hours)
// @access  Public
router.get('/public', getPublicSettings);
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
