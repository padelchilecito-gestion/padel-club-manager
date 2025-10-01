import apiClient from './api';

const getAllCourts = async () => {
  try {
    const response = await apiClient.get('/courts');
    return response.data;
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

// Add other court-related API functions here later (create, update, delete)

export const courtService = {
  getAllCourts,
};