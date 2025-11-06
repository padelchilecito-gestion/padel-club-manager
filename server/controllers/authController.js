// server/controllers/authController.js (CORREGIDO Y COMPLETADO)
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función helper para generar y establecer la cookie
const generateToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // Configuración de cookie REQUERIDA para producción cross-domain (Vercel/Render)
  res.cookie('token', token, {
    httpOnly: true, // El cliente (JS) no puede leerla
    secure: true, // Requerido para 'SameSite=None'. Solo se envía sobre HTTPS.
    sameSite: 'None', // Requerido para peticiones cross-site
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  });
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

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id); // Genera y setea la cookie

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
    role: role || 'Operator',
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
  // Limpiamos la cookie con la misma configuración
  res.cookie('token', '', {
    httpOnly: true,
    secure: true, // Debe coincidir
    sameSite: 'None', // Debe coincidir
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
    res.status(440);
    throw new Error('Usuario no encontrado');
  }
});

// --- INICIO DE LA CORRECCIÓN (FUNCIÓN FALTANTE) ---

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // req.user viene del middleware 'protect'
  const user = await User.findById(req.user._id);

  if (user) {
    // Actualizar campos
    user.username = req.body.username || user.username;

    // Solo actualizar la contraseña SI se provee una nueva
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Devolver el perfil actualizado (sin contraseña)
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// --- FIN DE LA CORRECCIÓN ---


// @desc    Check auth status
// @route   GET /api/auth/check
// @access  Private
const checkAuthStatus = asyncHandler(async (req, res) => {
  // Este endpoint solo es alcanzable si el middleware 'protect' tuvo éxito
  res.status(200).json({
    _id: req.user._id,
    username: req.user.username,
    role: req.user.role,
  });
});

// Exportar TODAS las funciones
module.exports = {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile, // <-- Asegurarse de que esté exportada
  checkAuthStatus,
};