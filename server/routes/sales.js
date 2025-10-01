const express = require('express');
const router = express.Router();
const { createSale, getSales } = require('../controllers/saleController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST api/sales
// @desc    Create a new sale
// @access  Operator/Admin
router.post('/', protect, createSale);

// @route   GET api/sales
// @desc    Get all sales
// @access  Operator/Admin
router.get('/', protect, getSales);

module.exports = router;