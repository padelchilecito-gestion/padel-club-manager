const Setting = require('../models/Setting');

// @desc    Get all settings for Admin
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
            return Setting.findOneAndUpdate(
                { key },
                { value: settings[key], lastUpdatedBy: req.user.id },
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

// --- NUEVA FUNCIÓN ---
// @desc    Get only the business hours
// @route   GET /api/settings/business-hours
// @access  Public
const getPublicBusinessHours = async (req, res) => {
    try {
        const businessHoursSetting = await Setting.findOne({ key: 'BUSINESS_HOURS' });
        
        if (businessHoursSetting) {
            res.json(JSON.parse(businessHoursSetting.value));
        } else {
            // Si no hay configuración, se devuelve un objeto vacío (todo cerrado)
            res.json({});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// ---------------------

module.exports = {
    getSettings,
    updateSettings,
    getPublicBusinessHours, // Exportamos la nueva función
};
