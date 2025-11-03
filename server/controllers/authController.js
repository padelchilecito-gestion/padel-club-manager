// server/controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Token and Set Cookie
const generateTokenAndSetCookie = (res, userId, userRole) => {
  const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  res.cookie('token', token, cookieOptions);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, lastName, username, email, password, phone } = req.body;
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('User or email already exists');
  }
  const user = await User.create({ name, lastName, username, email, password, phone });
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
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user and get token
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
    throw new Error('Invalid username or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
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
    throw new Error('User not found');
  }
});

// @desc    Logout user and clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0),
  };

  res.cookie('token', '', cookieOptions);
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Check authentication status
// @route   GET /api/auth/check
// @access  Private
const checkAuthStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
   if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
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
