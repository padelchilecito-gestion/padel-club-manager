const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Asegúrate de tener el modelo User.js

// Crear el primer usuario administrador (se puede ejecutar una sola vez o proteger)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe.' });
        }
        const user = new User({ username, password });
        await user.save();
        res.status(201).send({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send({ message: 'Credenciales inválidas.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send({ message: 'Credenciales inválidas.' });
        }

        // ⭐ MODIFICACIÓN IMPORTANTE: Añadimos el username al token
        // Esto es necesario para que el sistema de logs sepa QUIÉN hizo la acción.
        const payload = {
            id: user._id,
            role: user.role,
            username: user.username 
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        // Devolvemos tanto el token como el rol al frontend
        res.json({ token, role: user.role });

    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor' });
    }
});

module.exports = router;