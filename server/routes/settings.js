const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   GET api/settings
// @desc    Get all settings
// @access  Public (originally Admin)
router.get('/', getSettings);

// @route   PUT api/settings
// @desc    Update settings
// @access  Admin
router.put('/', protect, admin, updateSettings);

module.exports = router;
