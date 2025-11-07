import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { bookingService } from '../../services/bookingService';
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
// --- AÑADIDO ---
import QRCode from 'react-qr-code';
// ---------------

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentQR, setPaymentQR] = useState(''); // Esto guardará el link para el QR
  const { user } = useAuth();

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

  useEffect(() => {
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
        return prevCart;
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p._id === productId);
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item._id !== productId));
    } else if (product && newQuantity <= product.stock) {
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
    setPaymentQR('');

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
        fetchProducts(); // Refetch products to update stock
      } else if (paymentMethod === 'Mercado Pago') {
        
        // --- CORRECCIÓN ---
        // El objeto payer era el que faltaba y causaba el crash
        const paymentData = {
          items: [{
            title: 'Compra en Padel Club',
            unit_price: total,
            quantity: 1,
          }],
          payer: {
            name: "Cliente", // Puedes usar un dato genérico
            email: "test_user@test.com" // MP requiere un email
          },
          metadata: { 
            sale_items: saleData.items,
            user_id: user._id,
            username: user.username,
          }
        };
        // ------------------

        const preference = await bookingService.createPaymentPreference(paymentData);
        
        // --- MODIFICADO ---
        // Guardamos el link para mostrar el QR
        setPaymentQR(preference.init_point);
        // ------------------

        setCart([]); // Limpiamos el carrito
        fetchProducts(); // Recargamos el stock
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar la venta.');
    } finally {
      setLoading(false);
    }
  };

  // --- AÑADIDO ---
  // Lógica para mostrar el QR o el carrito
  const renderCartOrQR = () => {
    if (paymentQR) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold mb-4 text-primary">Escanea para Pagar</h2>
          <div className="bg-white p-4 rounded-lg">
            <QRCode value={paymentQR} size={256} />
          </div>
          <p className="text-2xl font-bold text-secondary mt-4">${total.toFixed(2)}</p>
          <button 
            onClick={() => setPaymentQR('')} 
            className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-md"
          >
            Nueva Venta
          </button>
        </div>
      );
    }

    return (
      <>
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
            <button onClick={() => handleFinalizeSale('Mercado Pago')} className="bg-blue-500 text-white font-bold p-3 rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={loading || cart.length === 0}>Mercado Pago (QR)</button>
          </div>
        </div>
      </>
    );
  };
  // ------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      <div className="lg:col-span-2 bg-dark-secondary p-4 rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Productos</h2>
        <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.trg.value)} className="w-full bg-dark-primary p-2 rounded-md mb-4 border border-gray-600" />
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

      <div className="bg-dark-secondary p-4 rounded-lg flex flex-col">
        {/* --- MODIFICADO --- */}
        {renderCartOrQR()}
        {/* ------------------ */}
      </div>
    </div>
  );
};

export default PosPage;
