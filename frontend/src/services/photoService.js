import axios from './api';

export const photoService = {
  getAllPhotos: async () => {
    const response = await axios.get('/photos');
    return response.data;
  },

  uploadPhoto: async (file, description = '', order = 0) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('description', description);
    formData.append('order', order);
    const response = await axios.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePhoto: async (id, description, order) => {
    const response = await axios.put(`/photos/${id}`, { description, order });
    return response.data;
  },

  deletePhoto: async (id) => {
    const response = await axios.delete(`/photos/${id}`);
    return response.data;
  },
};