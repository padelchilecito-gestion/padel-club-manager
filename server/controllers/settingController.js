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

// --- FUNCIÓN MODIFICADA Y RENOMBRADA ---
// @desc    Get all public settings
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res) => {
    try {
        // Obtenemos solo las claves públicas que nos interesan
        const settingsArray = await Setting.find({ 
            key: { $in: ['BUSINESS_HOURS', 'SHOP_ENABLED'] } 
        });

        const publicSettings = {
            businessHours: null,
            shopEnabled: false // Por defecto, la tienda está deshabilitada
        };

        settingsArray.forEach(setting => {
            if (setting.key === 'BUSINESS_HOURS') {
                publicSettings.businessHours = JSON.parse(setting.value);
            }
            if (setting.key === 'SHOP_ENABLED') {
                publicSettings.shopEnabled = (setting.value === 'true');
            }
        });
        
        res.json(publicSettings);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// ---------------------

module.exports = {
    getSettings,
    updateSettings,
    getPublicSettings, // Exportamos la nueva función
};
