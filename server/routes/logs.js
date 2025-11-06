// server/routes/logs.js (CORREGIDO Y VERIFICADO)
const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, admin, getLogs);

module.exports = router;
