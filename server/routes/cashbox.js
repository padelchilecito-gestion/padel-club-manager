const express = require('express');
const router = express.Router();
const {
  startCashboxSession,
  closeCashboxSession,
  getCurrentCashboxSession,
  getLastClosedSession,
} = require('../controllers/cashboxController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST api/cashbox/start
// @desc    Start a new cashbox session
// @access  Operator/Admin
router.post('/start', protect, startCashboxSession);

// @route   POST api/cashbox/close
// @desc    Close the current cashbox session
// @access  Operator/Admin
router.post('/close', protect, closeCashboxSession);

// @route   GET api/cashbox/current
// @desc    Get the current open cashbox session
// @access  Operator/Admin
router.get('/current', protect, getCurrentCashboxSession);

// @route   GET api/cashbox/last-closed
// @desc    Get the last closed session for reporting
// @access  Operator/Admin
router.get('/last-closed', protect, getLastClosedSession);


module.exports = router;