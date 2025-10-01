import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { bookingService } from '../../services/bookingService'; // For Mercado Pago preference
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentQR, setPaymentQR] = useState(''); // To store MP QR code data

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        setProducts(data.filter(p => p.stock > 0));
      } catch (err) {
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item =>
            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prevCart; // Do not add more than available stock
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p._id === productId);
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item._id !== productId));
    } else if (newQuantity <= product.stock) {
      setCart(prevCart =>
        prevCart.map(item =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleFinalizeSale = async (paymentMethod) => {
    if (cart.length === 0) return;

    setLoading(true);
    setError('');

    const saleData = {
      items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
      })),
      total,
      paymentMethod,
    };

    try {
      if (paymentMethod === 'Efectivo') {
        await saleService.createSale(saleData);
        alert('Venta registrada con éxito.');
        setCart([]);
        // Note: We should refetch products to update stock, or optimistically update UI
      } else if (paymentMethod === 'Mercado Pago') {
        // This flow is for generating a QR code in-person
        const paymentData = {
          items: [{
            title: 'Compra en Padel Club',
            unit_price: total,
            quantity: 1,
          }],
          // No payer needed for QR
          metadata: { sale_items: saleData.items } // For webhook processing
        };
        const preference = await bookingService.createPaymentPreference(paymentData);
        // A more advanced implementation would render a QR code from the preference ID
        alert(`Pago con Mercado Pago: Redirigir a ${preference.init_point}`);
        setPaymentQR(preference.init_point); // For demonstration
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      {/* Product List */}
      <div className="lg:col-span-2 bg-dark-secondary p-4 rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Productos</h2>
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-dark-primary p-2 rounded-md mb-4 border border-gray-600"
        />
        {loading && <p>Cargando...</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product._id} onClick={() => addToCart(product)} className="bg-dark-primary p-3 rounded-lg text-center cursor-pointer hover:bg-primary-dark transition-colors">
              <img src={product.imageUrl || 'https://via.placeholder.com/150'} alt={product.name} className="h-24 w-24 mx-auto rounded-md object-cover mb-2" />
              <p className="font-semibold truncate">{product.name}</p>
              <p className="text-sm text-secondary">${product.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-dark-secondary p-4 rounded-lg flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Carrito</h2>
        <div className="flex-grow overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-text-secondary text-center mt-8">El carrito está vacío.</p>
          ) : (
            cart.map(item => (
              <div key={item._id} className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-text-secondary">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}><MinusCircleIcon className="h-6 w-6 text-gray-400 hover:text-white" /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}><PlusCircleIcon className="h-6 w-6 text-gray-400 hover:text-white" /></button>
                  <button onClick={() => updateQuantity(item._id, 0)}><XCircleIcon className="h-6 w-6 text-danger hover:text-red-400" /></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between text-2xl font-bold mb-4">
            <span>Total:</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
          {error && <p className="text-danger text-center text-sm mb-2">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleFinalizeSale('Efectivo')} className="bg-secondary text-white font-bold p-3 rounded-md hover:bg-opacity-80 disabled:opacity-50" disabled={loading || cart.length === 0}>Efectivo</button>
            <button onClick={() => handleFinalizeSale('Mercado Pago')} className="bg-blue-500 text-white font-bold p-3 rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={loading || cart.length === 0}>Mercado Pago</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosPage;