// server/routes/logs.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, admin, logController.getLogs);

module.exports = router;
