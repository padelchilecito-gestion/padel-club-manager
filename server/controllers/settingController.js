const Setting = require('../models/Setting');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Admin
const getSettings = async (req, res) => {
    try {
        const settingsArray = await Setting.find({});
        // Convert array to a key-value object for easier use in the frontend
        const settingsObject = settingsArray.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        res.json(settingsObject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Admin
const updateSettings = async (req, res) => {
    const settings = req.body; // Expects an object like { KEY: 'value', ... }

    try {
        const promises = Object.keys(settings).map(key => {
            const updateData = { value: settings[key] };
            // Defensively check for req.user to prevent crash if it's missing
            if (req.user && req.user.id) {
                updateData.lastUpdatedBy = req.user.id;
            }

            return Setting.findOneAndUpdate(
                { key },
                updateData,
                { new: true, upsert: true, runValidators: true } // upsert: create if not found
            );
        });

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
