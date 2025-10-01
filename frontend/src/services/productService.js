import apiClient from './api';

const getAllProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Add other product-related API functions here later (get by ID, etc.)

export const productService = {
  getAllProducts,
};