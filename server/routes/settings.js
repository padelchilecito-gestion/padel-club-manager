// server/routes/settings.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', settingController.getSettings);
router.put('/', protect, admin, settingController.updateSettings);

module.exports = router;
