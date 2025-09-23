import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente para una tarjeta de producto individual
const ProductCard = ({ product }) => (
    <div className="bg-dark-secondary rounded-lg shadow-lg overflow-hidden flex flex-col">
        <img src={product.imageUrl || 'https://via.placeholder.com/300x300.png?text=Producto'} alt={product.name} className="w-full h-48 object-cover"/>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-text-primary mb-2">{product.name}</h3>
            <p className="text-xs text-text-secondary bg-dark-primary px-2 py-1 rounded-full self-start mb-2">{product.category}</p>
            <div className="flex-grow" />
            <div className="flex justify-between items-center mt-4">
                <p className="text-2xl font-bold text-secondary">${product.price}</p>
                <p className="text-sm text-text-secondary">Stock: {product.stock}</p>
            </div>
        </div>
    </div>
);

// Componente principal de la página de la tienda
const ShopPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // ⭐ ¡CORRECCIÓN CLAVE! Usamos la nueva ruta pública
                const res = await axios.get('/products/public');
                setProducts(res.data);
            } catch (err) {
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return <div className="text-center p-8">Cargando productos...</div>;
    if (error) return <div className="text-danger text-center p-8">{error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-5xl font-bold font-title text-primary tracking-wide text-center mb-8">Nuestra Tienda</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.length > 0 ? (
                    products.map(product => <ProductCard key={product._id} product={product} />)
                ) : (
                    <p className="col-span-full text-center text-text-secondary">No hay productos de pádel disponibles en este momento.</p>
                )}
            </div>
        </div>
    );
};

export default ShopPage;