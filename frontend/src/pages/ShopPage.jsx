import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import ProductCard from '../components/ProductCard';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        setProducts(data);
      } catch (err) {
        setError('No se pudieron cargar los productos. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-primary">Tienda del Club</h1>
        <p className="text-text-secondary mt-2">Equipamiento, bebidas y todo lo que necesitas para tu partido.</p>
      </header>

      <main>
        {loading && <p className="text-center text-lg text-text-secondary">Cargando productos...</p>}
        {error && <p className="text-center text-lg text-danger">{error}</p>}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

       <footer className="text-center mt-12 py-4 border-t border-gray-700">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default ShopPage;
