// server/controllers/authController.js (CORREGIDO Y FINALIZADO)
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función para generar el token
const generateTokenAndSetCookie = (res, userId, userRole) => {
  const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // --- INICIO DE LA CORRECCIÓN DE DOMINIO ---
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
  };

  // ESTA ES LA LÍNEA CLAVE
  // Se cambió "FRONTEND_URL" por "CLIENT_URL" para que coincida con tu variable de entorno
  if (isProduction && process.env.CLIENT_URL) {
    try {
      cookieOptions.domain = new URL(process.env.CLIENT_URL).hostname;
    } catch (error) {
      console.error('La CLIENT_URL no es una URL válida:', process.env.CLIENT_URL);
    }
  }
  // --- FIN DE LA CORRECCIÓN DE DOMINIO ---

  res.cookie('token', token, cookieOptions); // Usamos las opciones configuradas
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
  const user = await User.create({ name, lastName, username, email, password, phone });
  if (user) {
    generateTokenAndSetCookie(res, user._id, user.role); // <- Llama a la función corregida
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
    generateTokenAndSetCookie(res, user._id, user.role); // <- Llama a la función corregida
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
  const user = await User.findById(req.user.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Actualizar perfil de usuario
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.username = req.body.username || user.username;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Cerrar sesión y limpiar cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // --- CORRECCIÓN DE DOMINIO PARA LOGOUT ---
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0), // Expira la cookie inmediatamente
  };
  
  // Se cambió "FRONTEND_URL" por "CLIENT_URL"
  if (isProduction && process.env.CLIENT_URL) {
    try {
      cookieOptions.domain = new URL(process.env.CLIENT_URL).hostname;
    } catch (error) {
      console.error('La CLIENT_URL no es una URL válida:', process.env.CLIENT_URL);
    }
  }
  // --- FIN DE LA CORRECCIÓN ---

  res.cookie('token', '', cookieOptions);
  res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

// @desc    Verificar estado de autenticación
// @route   GET /api/auth/check
// @access  Private (usa 'protect')
const checkAuthStatus = asyncHandler(async (req, res) => {
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
  updateUserProfile,
  logoutUser,
  checkAuthStatus,
};
