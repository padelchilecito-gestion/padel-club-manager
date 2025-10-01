const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs with pagination
// @route   GET /api/logs
// @access  Admin
const getLogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  try {
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username');

    const totalLogs = await ActivityLog.countDocuments();
    const totalPages = Math.ceil(totalLogs / limit);

    res.json({
      logs,
      page,
      totalPages,
      totalLogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getLogs,
};