import apiClient from './api';

// Note: The 'register' function is in authService, but we might want to move it here
// or create a dedicated function for admin-led user creation.
// For now, we can reuse the one from authService.
import { authService } from './authService';

const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error.response?.data || error;
  }
};

const createUser = async (userData) => {
    // This is essentially registering a user as an admin
    return authService.register(userData);
};

const deleteUser = async (id) => {
  try {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error.response?.data || error;
  }
};

export const userService = {
  getAllUsers,
  createUser,
  deleteUser,
};