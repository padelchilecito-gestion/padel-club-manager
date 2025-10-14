import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';

const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Bebidas',
    price: '',
    stock: '',
    trackStockAlert: true,
    lowStockThreshold: 5,
    showInShop: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!product;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        trackStockAlert: product.trackStockAlert,
        lowStockThreshold: product.lowStockThreshold,
        showInShop: product.showInShop,
      });
    }
  }, [product, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (isEditMode) {
        await productService.updateProduct(product._id, data);
      } else {
        await productService.createProduct(data);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-primary mb-6">{isEditMode ? 'Editar Producto' : 'Añadir Producto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Nombre</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Categoría</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
              <option>Bebidas</option>
              <option>Snacks</option>
              <option>Accesorios</option>
              <option>Ropa</option>
              <option>Otros</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text-secondary">Precio</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-text-secondary">Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-text-secondary">Imagen</label>
            <input type="file" name="image" onChange={handleFileChange} className="w-full mt-1 text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark" />
            {isEditMode && product.imageUrl && <img src={product.imageUrl} alt="preview" className="h-16 w-16 mt-2 rounded-md object-cover"/>}
          </div>
          <div className="flex items-center gap-4">
            <input type="checkbox" name="trackStockAlert" checked={formData.trackStockAlert} onChange={handleChange} className="h-4 w-4 rounded border-gray-600 bg-dark-primary text-primary focus:ring-primary" />
            <label htmlFor="trackStockAlert" className="text-sm text-text-secondary">Activar alerta de bajo stock</label>
          </div>
          {formData.trackStockAlert && (
             <div>
              <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-text-secondary">Umbral de alerta</label>
              <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} required min="0" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <input type="checkbox" name="showInShop" checked={formData.showInShop} onChange={handleChange} className="h-4 w-4 rounded border-gray-600 bg-dark-primary text-primary focus:ring-primary" />
            <label htmlFor="showInShop" className="text-sm text-text-secondary">Mostrar en la tienda pública</label>
          </div>
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
