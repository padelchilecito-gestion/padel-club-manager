// server/routes/logs.js (CORRECTED)
const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Solo Admin puede ver los logs
router.get('/', protect, admin, getLogs);

module.exports = router;
