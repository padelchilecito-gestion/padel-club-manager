// server/controllers/authController.js - CORREGIDO
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { logActivity } = require('../utils/logActivity.js');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    await logActivity(user, 'LOGIN_SUCCESS', `Usuario ${user.username} inició sesión`);

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
    });
  } else {
    await logActivity(null, 'LOGIN_FAIL', `Intento fallido de inicio de sesión para ${username}`);
    res.status(401);
    throw new Error('Usuario o contraseña inválidos');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    await logActivity(req.user, 'LOGOUT', `Usuario ${req.user.username} cerró sesión`);
  }

  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'none', 
  });
  res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    
    await logActivity(updatedUser, 'PROFILE_UPDATE', `Usuario ${updatedUser.username} actualizó su perfil`);

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

// @desc    Check auth status
// @route   GET /api/auth/status
// @access  Public (depends on cookie)
const checkAuthStatus = asyncHandler(async (req, res) => {
  if (req.user) {
    res.json({
      isAuthenticated: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        role: req.user.role,
      }
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});

// Exportamos usando module.exports
module.exports = {
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  checkAuthStatus
};
