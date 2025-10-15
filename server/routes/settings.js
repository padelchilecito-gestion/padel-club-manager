// server/routes/settings.js - CORREGIDO

const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   GET /api/settings
// @desc    Get club settings
// @access  Public
router.get('/', getSettings);

// @route   PUT /api/settings
// @desc    Update club settings
// @access  Private/Admin
router.put('/', protect, admin, updateSettings); // <-- La corrección estaba aquí

module.exports = router;