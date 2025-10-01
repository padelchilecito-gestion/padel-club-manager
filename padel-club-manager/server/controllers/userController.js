const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/logActivity');
require('dotenv').config();

const generateToken = (id, role, username) => {
  return jwt.sign({ id, role, username }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Admin
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      password,
      role,
    });

    if (user) {
      // Log the activity. req.user is available because this is an admin route.
      const logDetails = `User '${user.username}' with role '${user.role}' was created by admin '${req.user.username}'.`;
      await logActivity(req.user, 'USER_REGISTERED', logDetails);

      // Don't return a token, just confirmation. The new user can log in separately.
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user._id.equals(req.user.id)) {
                return res.status(400).json({ message: 'Cannot delete the currently logged-in admin.' });
            }
            const deletedUsername = user.username;
            await user.remove();

            const logDetails = `User '${deletedUsername}' was deleted by admin '${req.user.username}'.`;
            await logActivity(req.user, 'USER_DELETED', logDetails); // Need to add USER_DELETED to enum

            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
  registerUser,
  getAllUsers,
  deleteUser,
};