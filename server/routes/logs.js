// server/routes/logs.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware'); // Se importa 'admin'

// Se usa el middleware 'admin'
router.get('/', protect, admin, getLogs);

module.exports = router;
