const User = require('../models/User');
const { logActivity } = require('../utils/logActivity');

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
            // await user.remove(); -> .remove() está obsoleto
            await User.deleteOne({ _id: req.params.id });
            
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

// --- NUEVAS FUNCIONES ---

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Admin
const updateUserRole = async (req, res) => {
    const { role } = req.body;
    
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user._id.equals(req.user.id)) {
            return res.status(400).json({ message: 'Admins cannot change their own role.' });
        }

        user.role = role;
        await user.save();

        const logDetails = `User '${user.username}' role was changed to '${role}' by admin '${req.user.username}'.`;
        await logActivity(req.user, 'USER_UPDATED', logDetails); // Asumiendo que tienes USER_UPDATED

        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile (e.g., password)
// @route   PUT /api/users/profile
// @access  Private (Self)
const updateUserProfile = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!(await user.matchPassword(oldPassword))) {
            return res.status(401).json({ message: 'Invalid old password' });
        }

        user.password = newPassword;
        await user.save();
        
        const logDetails = `User '${user.username}' changed their own password.`;
        await logActivity(user, 'USER_UPDATED', logDetails);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
  registerUser,
  getAllUsers,
  deleteUser,
  updateUserRole,    // <-- Exportar nuevo
  updateUserProfile, // <-- Exportar nuevo
};
