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

export const saleService = {
  createSale,
};