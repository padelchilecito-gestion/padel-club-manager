const ActivityLog = require('../models/ActivityLog');

/**
 * Logs an activity to the database.
 * @param {object} user - The user object from req.user (must have id and username).
 * @param {string} action - The action type from the enum in ActivityLog model.
 * @param {string} details - A descriptive string of the action.
 */
const logActivity = async (user, action, details) => {
  try {
    if (!user || !user.id) {
        console.error('LogActivity Error: User is required to log an activity.');
        // In a real app, you might want to handle this case more gracefully
        // For now, we create a log with a system user placeholder
        const log = new ActivityLog({
            user: '000000000000000000000000', // Placeholder for system/unknown user
            username: 'System',
            action,
            details,
        });
        await log.save();
        return;
    }

    const log = new ActivityLog({
      user: user.id,
      username: user.username,
      action,
      details,
    });
    await log.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
    // We don't throw an error here because logging should not
    // interrupt the main operation (e.g., creating a court).
  }
};

module.exports = { logActivity };