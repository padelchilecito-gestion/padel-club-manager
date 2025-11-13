import apiClient from './api';

const createPaymentPreference = async (paymentData) => {
    try {
        const response = await apiClient.post('/payments/create-preference', paymentData);
        return response.data;
    } catch (error) {
        console.error('Error creating payment preference:', error);
        throw error.response?.data || error;
    }
};

export const paymentService = {
  createPaymentPreference,
};
