const express = require('express');
const router = express.Router();
const { resetDatabase } = require('../controllers/debugController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   DELETE api/debug/reset-database
// @desc    Delete all data from collections (except users)
// @access  Admin
router.delete('/reset-database', protect, admin, resetDatabase);

module.exports = router;