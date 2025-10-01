const ActivityLog = require('../models/ActivityLog');

/**
 * Logs an activity to the database.
 * @param {object} user - The user object from req.user (must have id and username).
 * @param {string} action - The action type from the enum in ActivityLog model.
 * @param {string} details - A descriptive string of the action.
 */
const logActivity = async (user, action, details) => {
  try {
    // If user is null (e.g., public registration), log as a system action.
    const logData = {
        user: user ? user.id : null,
        username: user ? user.username : 'System',
        action,
        details,
    };
    const log = new ActivityLog(logData);
    await log.save();
  } catch (error) {
    console.error(`Failed to log activity: ${action}.`, error);
    // Logging should not interrupt the main operation.
  }
};

module.exports = { logActivity };