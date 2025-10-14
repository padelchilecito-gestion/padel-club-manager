import apiClient from './api';

const getAllProducts = async (visible = false) => {
  try {
    const params = visible ? { visible: 'true' } : {};
    const response = await apiClient.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const createProduct = async (formData) => {
    try {
        const response = await apiClient.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error.response?.data || error;
    }
};

const updateProduct = async (id, formData) => {
    try {
        const response = await apiClient.put(`/products/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error.response?.data || error;
    }
};

const deleteProduct = async (id) => {
    try {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error.response?.data || error;
    }
};

export const productService = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
