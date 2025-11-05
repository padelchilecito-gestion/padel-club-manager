// server/routes/courts.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.get('/', courtController.getCourts);
router.get('/:id', courtController.getCourtById);

router.post('/', protect, adminOrOperator, courtController.createCourt);
router.put('/:id', protect, adminOrOperator, courtController.updateCourt);
router.delete('/:id', protect, adminOrOperator, courtController.deleteCourt);

module.exports = router;
