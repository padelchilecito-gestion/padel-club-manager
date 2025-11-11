const Setting = require('../models/Setting');

// @desc    Get all settings for Admin
// @route   GET /api/settings
// @access  Admin
const getSettings = async (req, res) => {
    try {
        const settingsArray = await Setting.find({});
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
    const settings = req.body; 

    try {
        const promises = Object.keys(settings).map(key => {
            return Setting.findOneAndUpdate(
                { key },
                { value: settings[key], lastUpdatedBy: req.user.id },
                { new: true, upsert: true, runValidators: true } 
            );
        });

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all public settings
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res) => {
    try {
        // --- Claves públicas que el frontend necesita ---
        const publicKeys = [
            'BUSINESS_HOURS', 
            'SHOP_ENABLED',
            'PUBLIC_TITLE',
            'PUBLIC_SUBTITLE',
            'PUBLIC_CONTACT_NUMBER',
            'OWNER_NOTIFICATION_NUMBER'
        ];
        
        const settingsArray = await Setting.find({ 
            key: { $in: publicKeys } 
        });

        // --- Valores por defecto ---
        const publicSettings = {
            businessHours: null,
            shopEnabled: false,
            publicTitle: 'Padel Club Manager',
            publicSubtitle: 'Encuentra y reserva tu cancha de pádel en segundos',
            publicContactNumber: '',
            ownerNotificationNumber: ''
        };

        // --- Mapeamos los valores de la BD ---
        settingsArray.forEach(setting => {
            if (setting.key === 'BUSINESS_HOURS') {
                publicSettings.businessHours = JSON.parse(setting.value);
            }
            if (setting.key === 'SHOP_ENABLED') {
                publicSettings.shopEnabled = (setting.value === 'true');
            }
            if (setting.key === 'PUBLIC_TITLE') {
                publicSettings.publicTitle = setting.value;
            }
            if (setting.key === 'PUBLIC_SUBTITLE') {
                publicSettings.publicSubtitle = setting.value;
            }
            if (setting.key === 'PUBLIC_CONTACT_NUMBER') {
                publicSettings.publicContactNumber = setting.value;
            }
            if (setting.key === 'OWNER_NOTIFICATION_NUMBER') {
                publicSettings.ownerNotificationNumber = setting.value;
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
    getPublicSettings,
};
