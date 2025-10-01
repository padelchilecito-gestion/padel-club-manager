const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   GET api/logs
// @desc    Get all activity logs with pagination
// @access  Admin
router.get('/', protect, admin, getLogs);

module.exports = router;