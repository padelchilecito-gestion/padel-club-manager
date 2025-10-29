// frontend/src/services/courtService.js
import api from './api';

// Obtener todas las canchas
export const getCourts = async () => {
  try {
    const { data } = await api.get('/courts');
    return data;
  } catch (error) {
    console.error('Error fetching courts:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al obtener las canchas');
  }
};

// Crear una nueva cancha
export const createCourt = async (courtData) => {
  try {
    const { data } = await api.post('/courts', courtData);
    return data;
  } catch (error) {
    console.error('Error creating court:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al crear la cancha');
  }
};

// Actualizar una cancha
export const updateCourt = async (id, courtData) => {
  try {
    const { data } = await api.put(`/courts/${id}`, courtData);
    return data;
  } catch (error) {
    console.error(`Error updating court ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al actualizar la cancha');
  }
};

// Eliminar una cancha
export const deleteCourt = async (id) => {
  try {
    const { data } = await api.delete(`/courts/${id}`);
    return data;
  } catch (error) {
    console.error(`Error deleting court ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al eliminar la cancha');
  }
};
