const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// GET: Obtener todos los logs, paginados
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20; // 20 logs por página
        const skip = (page - 1) * limit;

        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await ActivityLog.countDocuments();

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los logs.' });
    }
});

module.exports = router;