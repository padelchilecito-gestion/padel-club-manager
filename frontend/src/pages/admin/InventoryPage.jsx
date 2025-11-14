import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSuccess = () => {
    fetchProducts(); // Refetch products after a successful operation
    handleCloseModal();
  };

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productService.deleteProduct(productId);
        alert('Producto eliminado con éxito.');
        fetchProducts(); // Refetch
      } catch (err) {
        alert('Error al eliminar el producto.');
      }
    }
  };
  
  if (loading) return <div className="text-center p-8">Cargando inventario...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div>
      {/* --- HEADER MODIFICADO --- */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Gestión de Inventario</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors w-full md:w-auto"
        >
          Añadir Producto
        </button>
      </div>

      <div className="bg-dark-secondary shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-primary uppercase bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3">Imagen</th>
              <th scope="col" className="px-6 py-3">Nombre</th>
              <th scope="col" className="px-6 py-3">Categoría</th>
              <th scope="col" className="px-6 py-3">Precio</th>
              <th scope="col" className="px-6 py-3">Stock</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-gray-700 hover:bg-dark-primary">
                <td className="px-6 py-4">
                  {/* --- ¡LÍNEA CORREGIDA! --- */}
                  <img src={product.imageUrl || 'https://via.placeholder.com/50'} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                </td>
                <td className="px-6 py-4 font-medium text-text-primary">{product.name}</td>
                <td className="px-6 py-4">{product.category}</td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">{product.stock}</td>
                <td className="px-6 py-4 flex items-center gap-4">
                  <button onClick={() => handleOpenModal(product)} className="text-blue-400 hover:text-blue-300" title="Editar Producto">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="text-danger hover:text-red-400" title="Eliminar Producto">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <ProductFormModal
          product={selectedProduct}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default InventoryPage;
