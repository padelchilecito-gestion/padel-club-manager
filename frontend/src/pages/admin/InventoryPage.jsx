// frontend/src/pages/admin/InventoryPage.jsx - CORREGIDO
import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import ProductFormModal from '../../components/admin/ProductFormModal';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { InlineLoading, ErrorMessage } from '../../components/ui/Feedback';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar error anterior
      const data = await productService.getProducts(); // Usar la función corregida
      setProducts(data);
    } catch (err) {
      console.error('Error detallado en fetchProducts (InventoryPage):', err); // <-- Log más detallado
      setError('No se pudieron cargar los productos. Revisa la consola para más detalles.'); // Mensaje genérico para el usuario
      // toast.error('No se pudieron cargar los productos.'); // Quitamos el toast de aquí para usar ErrorMessage
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = () => {
    setShowModal(false);
    setSelectedProduct(null);
    fetchProducts(); // Recargar productos después de guardar
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productService.deleteProduct(id);
        toast.success('Producto eliminado con éxito');
        fetchProducts(); // Recargar productos
      } catch (err) {
        toast.error('Error al eliminar el producto');
        console.error('Error deleting product:', err);
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Gestión de Inventario</h1>

      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full max-w-md"
        />
        <button
          onClick={() => { setSelectedProduct(null); setShowModal(true); }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Producto
        </button>
      </div>

      {loading && <InlineLoading text="Cargando inventario..." />}
      
      {error && !loading && <ErrorMessage message={error} />} 

      {!loading && !error && (
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Imagen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Alerta Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                      No se encontraron productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-12 w-12 bg-gray-600 rounded-md flex items-center justify-center">
                          {product.imageUrl ? (
                            <img className="h-12 w-12 rounded-md object-cover" src={product.imageUrl} alt={product.name} />
                          ) : (
                            <span className="text-gray-400 text-xs">Sin img</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${product.price}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        product.trackStockAlert && product.stock <= product.lowStockThreshold ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {product.stock}
                        {product.trackStockAlert && product.stock <= product.lowStockThreshold && (
                          <ExclamationTriangleIcon className="h-4 w-4 inline-block ml-1 text-yellow-500" title="Stock bajo" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {product.trackStockAlert ? `Sí ( < ${product.lowStockThreshold} )` : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(product)} className="text-cyan-400 hover:text-cyan-300 mr-4 transition-colors" title="Editar">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-400 transition-colors" title="Eliminar">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ProductFormModal
          product={selectedProduct}
          onClose={() => { setShowModal(false); setSelectedProduct(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default InventoryPage;
