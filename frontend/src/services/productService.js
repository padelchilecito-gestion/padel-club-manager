// frontend/src/services/productService.js - CORREGIDO
import api from './api';

// Obtener todos los productos
const getProducts = async () => {
  try {
    const { data } = await api.get('/products');
    return data;
  } catch (error) {
    console.error('Error fetching products:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al obtener productos');
  }
};

// Obtener un producto por ID
const getProductById = async (id) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al obtener el producto');
  }
};

// Crear un nuevo producto (requiere FormData si hay imagen)
const createProduct = async (productData) => {
  try {
    // Asumimos que productData es FormData si incluye una imagen
    const config = productData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } } 
      : {};
    const { data } = await api.post('/products', productData, config);
    return data;
  } catch (error) {
    console.error('Error creating product:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al crear el producto');
  }
};

// Actualizar un producto (requiere FormData si hay imagen)
const updateProduct = async (id, productData) => {
  try {
    // Asumimos que productData es FormData si incluye una imagen
    const config = productData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } } 
      : {};
    const { data } = await api.put(`/products/${id}`, productData, config);
    return data;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al actualizar el producto');
  }
};

// Eliminar un producto
const deleteProduct = async (id) => {
  try {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al eliminar el producto');
  }
};

// --- INICIO DE LA CORRECCIÓN ---
// Exportar un objeto que contenga las funciones definidas arriba
export const productService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
// --- FIN DE LA CORRECCIÓN ---
