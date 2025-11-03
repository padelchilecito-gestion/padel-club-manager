// server/controllers/authController.js (CORREGIDO)
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función para generar el token (ya la tenías)
const generateTokenAndSetCookie = (res, userId, userRole) => {
  const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    // --- ESTO ES CRÍTICO y depende de la variable NODE_ENV ---
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    // ----------------------------------------------------
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, lastName, username, email, password, phone } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('El usuario o email ya existe');
  }

  const user = await User.create({
    name,
    lastName,
    username,
    email,
    password,
    phone,
  });

  if (user) {
    generateTokenAndSetCookie(res, user._id, user.role);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ $or: [{ email: username }, { username: username }] });

  if (user && (await user.matchPassword(password))) {
    generateTokenAndSetCookie(res, user._id, user.role);
    res.json({
      _id: user._id,
      name: user.name,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } else {
    res.status(401);
    throw new Error('Usuario o contraseña inválidos');
  }
});

// @desc    Obtener perfil de usuario
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user es asignado por el middleware 'protect'
  const user = await User.findById(req.user.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// --- FUNCIÓN AÑADIDA ---
// @desc    Cerrar sesión y limpiar cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    expires: new Date(0), // Expira la cookie inmediatamente
  });
  res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

// --- FUNCIÓN AÑADIDA ---
// @desc    Verificar estado de autenticación
// @route   GET /api/auth/check
// @access  Private (usa 'protect')
const checkAuthStatus = asyncHandler(async (req, res) => {
  // Si el middleware 'protect' pasa, req.user existe.
  // Devolvemos los mismos datos que el login/profile.
  const user = await User.findById(req.user.id).select('-password');
   if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,       // <-- Añadido
  checkAuthStatus,  // <-- Añadido
};
