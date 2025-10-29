// frontend/src/pages/admin/PosPage.jsx - CORREGIDO (Muestra Imágenes)
import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { toast } from 'react-hot-toast';
import { QrCodeIcon, PlusIcon, MinusIcon, XCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import PosQRModal from '../../components/admin/PosQRModal';
import { InlineLoading } from '../../components/ui/Feedback';

// Componente interno para la grilla de productos - CORREGIDO PARA MOSTRAR IMAGEN
const ProductGrid = ({ products, onAddToCart, loading }) => (
  <div className="bg-gray-800 p-4 rounded-lg h-[80vh] overflow-y-auto">
    <h2 className="text-2xl font-bold text-white mb-4">Productos</h2>
    {loading ? (
      <InlineLoading text="Cargando productos..." />
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"> {/* Ajustado grid para imágenes */}
        { /* Si no hay productos DESPUÉS de filtrar, muestra un mensaje */ }
        {products.length === 0 && !loading && (
          <p className="text-gray-400 col-span-full text-center py-10">
            No hay productos con stock disponibles para mostrar.
          </p>
        )}
        {products.map((product) => (
          <button
            key={product._id}
            onClick={() => onAddToCart(product)}
            className="bg-gray-900 rounded-lg text-left hover:bg-cyan-900 transition-all shadow-lg overflow-hidden flex flex-col" // Added flex
          >
            {/* --- INICIO: AÑADIDO PARA MOSTRAR IMAGEN --- */}
            <div className="w-full h-32 bg-gray-700 flex items-center justify-center"> {/* Placeholder aspect ratio */}
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover" // Cover ensures image fills space
                  loading="lazy" // Lazy load images
                />
              ) : (
                <ShoppingCartIcon className="h-12 w-12 text-gray-500" /> // Placeholder icon
              )}
            </div>
            {/* --- FIN: AÑADIDO PARA MOSTRAR IMAGEN --- */}
            <div className="p-3 flex-grow flex flex-col justify-between"> {/* Flex grow for text area */}
              <div>
                <p className="text-white font-semibold truncate text-sm mb-1">{product.name}</p>
                <p className="text-cyan-400 font-bold text-base">${product.price}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">Stock: {product.stock}</p>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

// Componente interno para el carrito (Sin cambios)
const Cart = ({ cart, setCart, total, onRegisterSale, onShowQR }) => {
    // ... (código del carrito sin cambios) ...
      const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      // Encontrar el stock máximo del producto en el carrito
      const itemInCart = cart.find(item => item.productId === productId);
      const maxStock = itemInCart ? itemInCart.stock : 0; 
      
      if (newQuantity > maxStock) {
        toast.error(`Stock máximo (${maxStock}) alcanzado.`);
        newQuantity = maxStock; // No permitir superar el stock
      }

      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg h-[80vh] flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-4">Carrito</h2>
      <div className="flex-grow overflow-y-auto space-y-2">
        {cart.length === 0 ? (
          <div className="text-gray-400 flex flex-col items-center justify-center h-full">
            <ShoppingCartIcon className="h-16 w-16 text-gray-600 mb-4" />
            <p>El carrito está vacío</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between bg-gray-900 p-2 rounded-lg">
              <div>
                <p className="text-white font-semibold">{item.name}</p>
                <p className="text-gray-400 text-sm">${item.price} x {item.quantity} = ${item.price * item.quantity}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="bg-gray-700 p-1 rounded-full text-white">
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="bg-gray-700 p-1 rounded-full text-white">
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button onClick={() => updateQuantity(item.productId, 0)} className="text-red-500 hover:text-red-400">
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-gray-700 mt-4 pt-4">
        <p className="text-3xl font-bold text-white mb-4">Total: ${total}</p>
        <div className="space-y-2">
          <button
            onClick={onRegisterSale}
            disabled={cart.length === 0}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            Registrar (Efectivo)
          </button>
          <button
            onClick={onShowQR} 
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            <QrCodeIcon className="h-6 w-6 mr-2" />
            Pagar con MP (QR)
          </button>
        </div>
      </div>
    </div>
  );
};


// Componente principal de la página (Quitado el console.log)
const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      
      // Ya no necesitamos el log aquí
      // console.log('DATOS CRUDOS DEL PRODUCTO (ANTES DE FILTRAR):', JSON.stringify(data, null, 2)); 

      setProducts(data.filter(p => p.stock > 0)); // Solo productos con stock > 0
    } catch (error) {
      toast.error('Error al cargar productos');
      console.error('Error en fetchProducts (POS Page):', error); // Mantenemos el log de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product._id);
      
      const stockAvailable = product.stock;
      const quantityInCart = existingItem ? existingItem.quantity : 0;

      if (quantityInCart >= stockAvailable) {
        toast.error(`Stock máximo alcanzado para ${product.name}`);
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { 
        productId: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        stock: product.stock // Guardar stock para referencia en el carrito
      }];
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleRegisterSale = async () => {
    if (cart.length === 0) return;
    try {
      await saleService.createSale({
        items: cart.map(item => ({ product: item.productId, name: item.name, quantity: item.quantity, price: item.price })),
        total: total,
        paymentMethod: 'Efectivo',
        status: 'Completed'
      });
      toast.success('Venta registrada (Efectivo)');
      setCart([]);
      fetchProducts(); 
    } catch (error) {
      toast.error('Error al registrar la venta');
    }
  };

  const handleQRModalClose = (paymentSuccess) => {
    setShowQRModal(false);
    if (paymentSuccess) {
      toast.success('Venta registrada (Mercado Pago)');
      setCart([]);
      fetchProducts(); // Re-fetch productos
    }
  };

  return (
    <div className="p-4 h-full">
      
      {showQRModal && (
        <PosQRModal 
          cart={cart}
          totalAmount={total}
          onClose={handleQRModalClose}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        <div className="md:col-span-2 h-full">
          <ProductGrid products={products} onAddToCart={handleAddToCart} loading={loading} />
        </div>
        <div className="h-full">
          <Cart 
            cart={cart} 
            setCart={setCart} 
            total={total} 
            onRegisterSale={handleRegisterSale}
            onShowQR={() => setShowQRModal(true)} 
          />
        </div>
      </div>
    </div>
  );
};

export default PosPage;
