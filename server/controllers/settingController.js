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
    const settings = req.body; // Expects an object like { KEY: 'value', ... }

    try {
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Filtramos las claves que realmente tienen un valor.
        // Si el frontend envía { "PUBLIC_CONTACT_NUMBER": "" }, lo ignoramos.
        
        const promises = Object.keys(settings)
            .filter(key => {
                // Solo procesamos si la clave tiene un valor (no es null, undefined, o string vacío)
                // (Mantenemos SHOP_ENABLED porque 'false' es un valor válido que queremos guardar)
                return settings[key] || key === 'SHOP_ENABLED'; 
            })
            .map(key => {
                return Setting.findOneAndUpdate(
                    { key },
                    { value: settings[key], lastUpdatedBy: req.user.id },
                    { new: true, upsert: true, runValidators: true } // upsert: create if not found
                );
            });
        // ---------------------------------

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error); // Logueamos el error de validación
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
            if (setting.key === 'PUBLIC_TITLE' && setting.value) { // Nos aseguramos que no sea nulo
                publicSettings.publicTitle = setting.value;
            }
            if (setting.key === 'PUBLIC_SUBTITLE' && setting.value) {
                publicSettings.publicSubtitle = setting.value;
            }
            if (setting.key === 'PUBLIC_CONTACT_NUMBER' && setting.value) {
                publicSettings.publicContactNumber = setting.value;
            }
            if (setting.key === 'OWNER_NOTIFICATION_NUMBER' && setting.value) {
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
