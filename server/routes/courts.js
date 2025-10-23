const express = require('express');
const router = express.Router();
const {
  createCourt,
  getAllCourts,
  getPublicCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
} = require('../controllers/courtController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   POST api/courts
// @desc    Create a new court
// @access  Admin
router.post('/', protect, admin, createCourt);

// @route   GET api/courts
// @desc    Get all courts
// @access  Public
router.get('/', getAllCourts);

// @route   GET api/courts/public
// @desc    Get all public courts
// @access  Public
router.get('/public', getPublicCourts);

// @route   GET api/courts/:id
// @desc    Get a single court by ID
// @access  Public
router.get('/:id', getCourtById);

// @route   PUT api/courts/:id
// @desc    Update a court
// @access  Admin
router.put('/:id', protect, admin, updateCourt);

// @route   DELETE api/courts/:id
// @desc    Delete a court
// @access  Admin
router.delete('/:id', protect, admin, deleteCourt);

module.exports = router;