// server/controllers/userController.js
const User = require('../models/User');
const { logActivity } = require('../utils/logActivity');

// @desc    Register a new user
// @route   POST /api/users
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
      const logDetails = `User '${user.username}' with role '${user.role}' was created by admin '${req.user.username}'.`;
      await logActivity(req.user, 'USER_REGISTERED', logDetails);

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
            await user.deleteOne();
            
            const logDetails = `User '${deletedUsername}' was deleted by admin '${req.user.username}'.`;
            await logActivity(req.user, 'USER_DELETED', logDetails);

            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- INICIO DE FUNCIONES FALTANTES ---

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Protected
const getUserProfile = async (req, res) => {
  try {
    // req.user.id es añadido por el middleware 'protect'
    const user = await User.findById(req.user.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Protected
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Protected (o Admin, según tu lógica de negocio)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.username = req.body.username || user.username;
      user.role = req.body.role || user.role;

      // Si se proporciona una nueva contraseña, el hook 'pre-save' en el modelo User.js la hasheará
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      
      const logDetails = `User '${updatedUser.username}' (ID: ${updatedUser._id}) was updated by '${req.user.username}'.`;
      await logActivity(req.user, 'USER_UPDATED', logDetails);

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- FIN DE FUNCIONES FALTANTES ---


module.exports = {
  registerUser,
  getAllUsers,
  deleteUser,
  getUserProfile, // <-- CORRECCIÓN: Exportar
  getUserById,    // <-- CORRECCIÓN: Exportar
  updateUser,     // <-- CORRECCIÓN: Exportar
};
