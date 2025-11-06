// server/controllers/authController.js (CORREGIDO)
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función helper para generar y establecer la cookie
const generateToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // --- INICIO DE LA CORRECCIÓN ---
  // Establecer la cookie HTTP-Only en la respuesta
  // Esta configuración es REQUERIDA para producción cross-domain (Vercel/Render)
  res.cookie('token', token, {
    httpOnly: true, // El cliente (JS) no puede leerla
    secure: true, // Requerido para 'SameSite=None'. Solo se envía sobre HTTPS.
    sameSite: 'None', // Requerido para peticiones cross-site (frontend en Vercel, backend en Render)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
  // --- FIN DE LA CORRECCIÓN ---
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Por favor, ingrese usuario y contraseña');
  }

  // Buscar usuario por username
  const user = await User.findOne({ username });

  // Validar usuario y contraseña
  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id); // Genera y setea la cookie

    // Devuelve los datos del usuario (sin el password)
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
    });
  } else {
    res.status(401);
    throw new Error('Usuario o contraseña inválidos');
  }
});

// @desc    Register a new user (Crear usuario)
// @route   POST /api/auth/register
// @access  Public (o Admin, según tu lógica de negocio)
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Por favor, ingrese todos los campos');
  }

  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400);
    throw new Error('El usuario ya existe');
  }

  const user = await User.create({
    username,
    password,
    role: role || 'Operator', // Default a 'Operator' si no se provee
  });

  if (user) {
    generateToken(res, user._id); // Genera y setea la cookie al registrar

    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // Para hacer logout, seteamos una cookie vacía que expira inmediatamente
  res.cookie('token', '', {
    httpOnly: true,
    secure: true, // Debe coincidir con la config de login
    sameSite: 'None', // Debe coincidir con la config de login
    expires: new Date(0), // Expira ahora
  });
  res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user es asignado por el middleware 'protect'
  if (req.user) {
    res.json({
      _id: req.user._id,
      username: req.user.username,
      role: req.user.role,
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Check auth status
// @route   GET /api/auth/check
// @access  Private
const checkAuthStatus = asyncHandler(async (req, res) => {
  // Este endpoint solo es alcanzable si el middleware 'protect' tuvo éxito
  // req.user ya está adjunto
  res.status(200).json({
    _id: req.user._id,
    username: req.user.username,
    role: req.user.role,
  });
});

module.exports = {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  checkAuthStatus,
};
