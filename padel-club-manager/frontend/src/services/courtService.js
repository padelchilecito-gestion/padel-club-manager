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

const createCourt = async (courtData) => {
    try {
        const response = await apiClient.post('/courts', courtData);
        return response.data;
    } catch (error) {
        console.error('Error creating court:', error);
        throw error.response?.data || error;
    }
};

const updateCourt = async (id, courtData) => {
    try {
        const response = await apiClient.put(`/courts/${id}`, courtData);
        return response.data;
    } catch (error) {
        console.error('Error updating court:', error);
        throw error.response?.data || error;
    }
};

const deleteCourt = async (id) => {
    try {
        const response = await apiClient.delete(`/courts/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting court:', error);
        throw error.response?.data || error;
    }
};

export const courtService = {
  getAllCourts,
  createCourt,
  updateCourt,
  deleteCourt,
};