const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Proteger la ruta y requerir rol de Admin
router.get('/', protect, admin, getLogs);

module.exports = router;
