import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { paymentService } from '../../services/paymentService';
import { 
    PlusCircleIcon, 
    MinusCircleIcon, 
    XCircleIcon, 
    CheckCircleIcon, 
    XMarkIcon // --- Icono para cerrar ---
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import QRCode from 'react-qr-code';
import socket from '../../services/socketService';

// --- NUEVO SUB-COMPONENTE: MODAL DE PANTALLA COMPLETA ---
const FullScreenQRModal = ({ qrValue, total, status, onClose }) => {
  return (
    // Fondo oscuro semi-transparente que cubre toda la pantalla
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      
      {/* Contenedor del QR */}
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-md text-center relative">
        
        {/* Botón de Cerrar (Cancelar) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>

        {/* Vista de Pago Exitoso */}
        {status === 'successful' ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <CheckCircleIcon className="h-32 w-32 text-secondary" />
            <h2 className="text-2xl font-bold mt-4 text-text-primary">¡Pago Recibido!</h2>
            <p className="text-3xl font-bold text-secondary mt-2">${total.toFixed(2)}</p>
            <button 
              onClick={onClose} 
              className="w-full mt-12 bg-primary hover:bg-primary-dark text-white font-bold p-3 rounded-md"
            >
              Nueva Venta
            </button>
          </div>
        ) : (
          // Vista de QR (Esperando pago)
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold mb-6 text-primary">Escanea para Pagar</h2>
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={qrValue} size={256} />
            </div>
            <p className="text-3xl font-bold text-secondary mt-6">${total.toFixed(2)}</p>
            
            {status === 'pending' && (
              <p className="text-xl text-yellow-400 mt-4 animate-pulse">
                Esperando confirmación de pago...
              </p>
            )}
            
            <button 
              onClick={onClose} 
              className="w-full mt-8 bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-md"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
// --- FIN DEL NUEVO SUB-COMPONENTE ---


const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [paymentQR, setPaymentQR] = useState(''); 
  const [paymentTotal, setPaymentTotal] = useState(0); 
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, pending, successful
  
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

  // Efecto para Socket.IO (sin cambios)
  useEffect(() => {
    socket.connect();
    
    const handleSaleCompleted = (saleData) => {
      if (saleData.total === paymentTotal && paymentStatus === 'pending') {
          setPaymentStatus('successful');
      }
    };

    socket.on('pos_sale_completed', handleSaleCompleted);

    return () => {
      socket.off('pos_sale_completed', handleSaleCompleted);
      socket.disconnect();
    };
  }, [paymentTotal, paymentStatus]); 

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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleFinalizeSale = async (paymentMethod) => {
    if (cart.length === 0) return;
    
    setLoading(true);
    setError('');
    setPaymentQR('');
    setPaymentStatus('idle');

    const saleTotal = cartTotal; 
    const saleData = {
      items: cart.map(item => ({ 
          productId: item._id, 
          name: item.name, 
          quantity: item.quantity, 
          price: item.price 
      })),
      total: saleTotal,
      paymentMethod,
    };

    try {
      if (paymentMethod === 'Efectivo') {
        await saleService.createSale(saleData);
        alert('Venta registrada con éxito.');
        setCart([]);
        fetchProducts(); 
      } else if (paymentMethod === 'Mercado Pago') {
        
        const paymentData = {
          items: [{
            title: 'Compra en Padel Club',
            unit_price: saleTotal,
            quantity: 1,
          }],
          payer: { name: "Cliente", email: "test_user@test.com" },
          metadata: { 
            sale_items: saleData.items,
            user_id: user._id,
            username: user.username,
          }
        };

        const preference = await paymentService.createPaymentPreference(paymentData);
        
        setPaymentTotal(saleTotal); 
        setPaymentQR(preference.init_point); // Esto activará el Modal
        setPaymentStatus('pending'); 
        
        setCart([]); 
        fetchProducts(); 
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar la venta.');
    } finally {
      setLoading(false);
    }
  };

  // Esta función ahora se pasa al Modal
  const handleNewSale = () => {
    setPaymentQR('');
    setPaymentStatus('idle');
    setPaymentTotal(0);
    setCart([]);
    setError('');
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
        {/* Columna de Productos (Izquierda) */}
        <div className="lg:col-span-2 bg-dark-secondary p-4 rounded-lg overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Productos</h2>
          <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-dark-primary p-2 rounded-md mb-4 border border-gray-600" />
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

        {/* Columna de Carrito (Derecha) - Ahora solo muestra el carrito */}
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
              <span className="text-primary">${cartTotal.toFixed(2)}</span>
            </div>
            {error && <p className="text-danger text-center text-sm mb-2">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleFinalizeSale('Efectivo')} className="bg-secondary text-white font-bold p-3 rounded-md hover:bg-opacity-80 disabled:opacity-50" disabled={loading || cart.length === 0}>Efectivo</button>
              <button onClick={() => handleFinalizeSale('Mercado Pago')} className="bg-blue-500 text-white font-bold p-3 rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={loading || cart.length === 0}>Mercado Pago (QR)</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- RENDERIZADO DEL MODAL DE PANTALLA COMPLETA --- */}
      {/* Se mostrará por encima de todo cuando paymentQR tenga un valor */}
      {paymentQR && (
        <FullScreenQRModal
          qrValue={paymentQR}
          total={paymentTotal}
          status={paymentStatus}
          onClose={handleNewSale}
        />
      )}
    </>
  );
};

export default PosPage;
