import apiClient from './api';

const createSale = async (saleData) => {
  try {
    const response = await apiClient.post('/sales', saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error.response?.data || error;
  }
};

// In a full application, you might also have a getSales function.
// const getSales = async () => { ... };

export const saleService = {
  createSale,
};
