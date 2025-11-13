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
    const settings = req.body; // Espera un objeto { KEY: 'value', ... }

    try {
        // --- LÓGICA DE FILTRO CORREGIDA ---
        // Ahora procesamos todas las claves que nos envía el frontend.
        // La validación de 'enum' en el modelo se encargará de rechazar claves inválidas.
        const promises = Object.keys(settings).map(key => {
            const value = settings[key];
            
            // Usamos findOneAndUpdate con 'upsert'
            return Setting.findOneAndUpdate(
                { key },
                { value: value, lastUpdatedBy: req.user.id },
                { new: true, upsert: true, runValidators: true } // upsert: crea si no existe
            );
        });
        // ---------------------------------

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error); // Logueamos el error de validación
        res.status(400).json({ message: 'Error al guardar la configuración: ' + error.message });
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
                // --- AÑADIDA PROTECCIÓN ---
                // Si el JSON está corrupto, lo ignoramos y usamos el default (null)
                try {
                    publicSettings.businessHours = JSON.parse(setting.value);
                } catch (e) {
                    console.error("Error al parsear BUSINESS_HOURS, usando default.", e.message);
                }
                // --------------------------
            }
            if (setting.key === 'SHOP_ENABLED') {
                publicSettings.shopEnabled = (setting.value === 'true');
            }
            if (setting.key === 'PUBLIC_TITLE' && setting.value) { 
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
