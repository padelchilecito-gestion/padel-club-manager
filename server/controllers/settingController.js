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
    // --- INICIO DE LA CORRECCIÓN ---
    // El frontend (SettingsPage.jsx) envía un ARRAY de objetos: [{key: 'KEY_1', value: 'VAL_1'}, ...]
    // El controlador antiguo esperaba un SOLO objeto: { KEY_1: 'VAL_1', ... }
    // Debemos procesar el array.
    
    const settingsArray = req.body; // req.body es AHORA un array

    // Validar que sea un array
    if (!Array.isArray(settingsArray)) {
        return res.status(400).json({ message: 'El formato de los datos es incorrecto. Se esperaba un array.' });
    }

    try {
        // Iterar sobre el array y crear una promesa de actualización para cada objeto
        const promises = settingsArray.map(setting => {
            const { key, value } = setting;
            
            // Si la clave no existe, no intentes guardarla (prevención)
            if (!key) {
                return Promise.resolve(); // Ignorar este item
            }

            const updateData = { value: value }; // El valor a guardar
            
            if (req.user && req.user.id) {
                updateData.lastUpdatedBy = req.user.id;
            }

            return Setting.findOneAndUpdate(
                { key: key }, // Buscar por la 'key'
                updateData,  // Actualizar el 'value' y 'lastUpdatedBy'
                { new: true, upsert: true, runValidators: true } // upsert: crear si no existe
            );
        });
        // --- FIN DE LA CORRECCIÓN ---

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error al actualizar settings:', error);
        // Devolver el error específico si es un CastError
        if (error.name === 'CastError') {
            return res.status(400).json({ message: `Error de formato: ${error.message}` });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
