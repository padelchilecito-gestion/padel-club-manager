import apiClient from './api';

const getDashboardData = async () => {
  try {
    const response = await apiClient.get('/reports/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

const getRevenueLast30Days = async () => {
    try {
        const response = await apiClient.get('/reports/revenue-last-30-days');
        return response.data;
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        throw error;
    }
};

const getTopSellingProducts = async () => {
    try {
        const response = await apiClient.get('/reports/top-selling-products');
        return response.data;
    } catch (error) {
        console.error('Error fetching top products:', error);
        throw error;
    }
};

const getCourtOccupancy = async () => {
    try {
        const response = await apiClient.get('/reports/court-occupancy');
        return response.data;
    } catch (error) {
        console.error('Error fetching court occupancy:', error);
        throw error;
    }
};


export const reportService = {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy,
};