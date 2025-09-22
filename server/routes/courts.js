const express = require('express');
const router = express.Router();
const Court = require('../models/Court');
const Booking = require('../models/Booking');

// ⭐ NUEVA RUTA: Encontrar canchas disponibles para un horario específico
router.get('/available', async (req, res) => {
    try {
        const { startTime, endTime } = req.query;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: "Se requieren fecha y hora de inicio y fin." });
        }

        const requestedStartTime = new Date(startTime);
        const requestedEndTime = new Date(endTime);

        // 1. Obtener todas las canchas que están activas
        const allActiveCourts = await Court.find({ isActive: true });

        // 2. Encontrar todas las reservas que se solapan con el horario solicitado
        const conflictingBookings = await Booking.find({
            startTime: { $lt: requestedEndTime },
            endTime: { $gt: requestedStartTime },
            status: { $in: ['Confirmed', 'Pending'] } // Considerar tanto pendientes como confirmadas
        });

        // 3. Crear una lista de los IDs de las canchas que ya están ocupadas
        const bookedCourtIds = conflictingBookings.map(b => b.court.toString());

        // 4. Filtrar la lista de todas las canchas para quedarnos solo con las que NO están en la lista de ocupadas
        const availableCourts = allActiveCourts.filter(court => 
            !bookedCourtIds.includes(court._id.toString())
        );

        res.json(availableCourts);

    } catch (error) {
        res.status(500).json({ message: "Error al buscar canchas disponibles." });
    }
});


// GET (Público): Obtener solo las canchas activas
router.get('/', async (req, res) => {
    try {
        const courts = await Court.find({ isActive: true });
        res.json(courts);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las canchas." });
    }
});

// GET (Admin): Obtener TODAS las canchas
router.get('/all', async (req, res) => {
    try {
        const courts = await Court.find({});
        res.json(courts);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener todas las canchas." });
    }
});

// ... (Las rutas POST, PUT, y DELETE para el admin se mantienen igual)
router.post('/', async (req, res) => {
    try {
        const { name, courtType, pricePerHour } = req.body;
        const newCourt = new Court({ name, courtType, pricePerHour });
        await newCourt.save();
        res.status(201).json(newCourt);
    } catch (error) {
        res.status(400).json({ message: "Error al crear la cancha." });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedCourt = await Court.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCourt) {
            return res.status(404).json({ message: "Cancha no encontrada." });
        }
        res.json(updatedCourt);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar la cancha." });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const court = await Court.findById(req.params.id);
        if (!court) {
            return res.status(404).json({ message: "Cancha no encontrada." });
        }
        court.isActive = !court.isActive;
        await court.save();
        res.json({ message: `Cancha ${court.isActive ? 'activada' : 'desactivada'} correctamente.` });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar el estado de la cancha." });
    }
});


module.exports = router;