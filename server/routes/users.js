const express = require('express');
const router = express.Router();
const User = require('../models/User');
// Aquí necesitaríamos un middleware de autenticación y autorización
// que por ahora asumiremos que existe y que verifica si el usuario es Admin.

// GET: Obtener todos los usuarios (solo para Admin)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Excluimos el password
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios.' });
    }
});

// POST: Crear un nuevo usuario (solo para Admin)
router.post('/', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya existe.' });
        }
        const user = new User({ username, password, role });
        await user.save();
        res.status(201).json({ message: 'Usuario creado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al crear usuario' });
    }
});

// PUT: Actualizar el rol de un usuario (solo para Admin)
router.put('/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        user.role = role;
        await user.save();
        res.json({ message: 'Rol de usuario actualizado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el rol.' });
    }
});

// DELETE: Eliminar un usuario (solo para Admin)
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.json({ message: 'Usuario eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario.' });
    }
});

module.exports = router;