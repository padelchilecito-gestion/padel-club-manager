import apiClient from './api';
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
    // Re-using the admin-protected register endpoint from authService
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