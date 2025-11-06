import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { QrCodeIcon, PlusIcon, MinusIcon, XCircleIcon, ShoppingCartIcon, XMarkIcon } from '@heroicons/react/24/solid';

// --- MOCK DE COMPONENTES Y SERVICIOS PARA EVITAR ERRORES DE RESOLUCIÓN ---

// 1. Mock de InlineLoading (Reemplaza: ../../components/ui/Feedback)
const InlineLoading = ({ text }) => (
  <div className="flex items-center justify-center space-x-2 py-10 text-cyan-400">
    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>{text}</span>
  </div>
);

// 2. Mock de PosQRModal (Reemplaza: ../../components/admin/PosQRModal)
// Este modal ahora solo muestra un mensaje de simulación
const PosQRModal = ({ saleId, totalAmount, onClose, onPaymentSuccess }) => {
  useEffect(() => {
    // Simular que la venta se completa después de 5 segundos
    const timer = setTimeout(() => {
      // Solo para simular el éxito en el entorno de desarrollo
      console.log(`Simulando pago exitoso para la venta: ${saleId}`);
      // Llama a la función de éxito para que el componente principal actualice el estado
      // onPaymentSuccess({ _id: saleId, total: totalAmount, status: 'Completed' });
    }, 5000); // 5 segundos para fines de demostración

    return () => clearTimeout(timer);
  }, [saleId, onPaymentSuccess, totalAmount]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-gray-800">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-blue-600">Pago QR (Mercado Pago Simulado)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="mb-4">
          Total a pagar: <span className="font-extrabold text-2xl">${totalAmount}</span>
        </p>
        <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
          <div className="mx-auto w-32 h-32 bg-gray-300 flex items-center justify-center rounded-lg mb-2">
            <QrCodeIcon className="h-16 w-16 text-gray-500" />
          </div>
          <p className="text-sm font-semibold">
            Escanea este código QR simulado para completar el pago.
          </p>
        </div>
        <p className="text-sm text-center text-red-500 font-semibold">
          (NOTA: En el entorno real, este modal se conectaría a la API de Mercado Pago.)
        </p>
        <button
          onClick={() => onPaymentSuccess({ _id: saleId, total: totalAmount, status: 'Completed' })}
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg font-bold hover:bg-blue-600"
        >
          Simular Pago Exitoso
        </button>
      </div>
    </div>
  );
};


// 3. Mock de productService (Reemplaza: ../../services/productService)
const mockProducts = [
  { _id: 'p1', name: 'Laptop Gamer', price: 1200, stock: 5, imageUrl: 'https://placehold.co/128x128/00a6ff/ffffff?text=LAPTOP' },
  { _id: 'p2', name: 'Teclado Mecánico RGB', price: 75, stock: 12, imageUrl: 'https://placehold.co/128x128/ff5733/ffffff?text=KEYBOARD' },
  { _id: 'p3', name: 'Mouse Inalámbrico Pro', price: 35, stock: 0, imageUrl: 'https://placehold.co/128x128/33ff57/ffffff?text=MOUSE' },
  { _id: 'p4', name: 'Monitor 27" 144Hz', price: 250, stock: 8, imageUrl: 'https://placehold.co/128x128/3357ff/ffffff?text=MONITOR' },
  { _id: 'p5', name: 'Webcam HD', price: 50, stock: 3, imageUrl: 'https://placehold.co/128x128/a633ff/ffffff?text=WEBCAM' },
  { _id: 'p6', name: 'Auriculares C/Micrófono', price: 90, stock: 6, imageUrl: 'https://placehold.co/128x128/ffa633/ffffff?text=HEADSET' },
];

const productService = {
  getProducts: async () => {
    // Simular retardo de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts;
  }
};

// 4. Mock de saleService (Reemplaza: ../../services/saleService)
const saleService = {
  createSale: async (saleData) => {
    // Simular retardo de red
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Venta creada simulada:', saleData);
    return { ...saleData, _id: `sale-${Date.now()}` };
  }
};
// --- FIN MOCK DE COMPONENTES Y SERVICIOS ---

// Componente interno para la grilla de productos
const ProductGrid = ({ products, onAddToCart, loading }) => (
  <div className="bg-gray-800 p-4 rounded-lg h-[80vh] overflow-y-auto">
    <h2 className="text-2xl font-bold text-white mb-4">Productos</h2>
    {loading ? (
      <InlineLoading text="Cargando productos..." />
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.length === 0 && !loading && (
          <p className="text-gray-400 col-span-full text-center py-10">
            No hay productos con stock disponibles para mostrar.
          </p>
        )}
        {products.map((product) => (
          <button
            key={product._id}
            onClick={() => onAddToCart(product)}
            // Usar stock para deshabilitar visualmente, pero la lógica de add to cart lo maneja
            disabled={product.stock <= 0}
            className={`rounded-lg text-left transition-all shadow-lg overflow-hidden flex flex-col ${
              product.stock > 0
                ? 'bg-gray-900 hover:bg-cyan-700'
                : 'bg-gray-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <ShoppingCartIcon className="h-12 w-12 text-gray-500" />
              )}
            </div>
            <div className="p-3 flex-grow flex flex-col justify-between">
              <div>
                <p className="text-white font-semibold truncate text-sm mb-1">{product.name}</p>
                <p className="text-cyan-400 font-bold text-base">${product.price}</p>
              </div>
              <p className={`text-xs mt-1 ${product.stock > 0 ? 'text-gray-400' : 'text-red-400 font-semibold'}`}>
                Stock: {product.stock}
              </p>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

// Componente interno para el carrito
const Cart = ({ cart, setCart, total, onRegisterSale, onShowQR }) => {
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      const itemInCart = cart.find(item => item.productId === productId);
      // Usamos el stock máximo que se guardó en el carrito cuando se agregó el producto
      const maxStock = itemInCart ? itemInCart.stock : 0;

      if (newQuantity > maxStock) {
        toast.error(`Stock máximo (${maxStock}) alcanzado.`);
        newQuantity = maxStock;
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
            <div key={item.productId} className="flex items-center justify-between bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-cyan-600 transition-colors">
              <div>
                <p className="text-white font-semibold">{item.name}</p>
                <p className="text-gray-400 text-sm">
                  ${item.price} x {item.quantity} = <span className="text-cyan-400 font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="bg-gray-700 p-1 rounded-full text-white hover:bg-gray-600 transition-colors"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="bg-gray-700 p-1 rounded-full text-white hover:bg-gray-600 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => updateQuantity(item.productId, 0)}
                  className="text-red-500 hover:text-red-400 p-1"
                  title="Eliminar del carrito"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-gray-700 mt-4 pt-4">
        <p className="text-3xl font-bold text-white mb-4">Total: ${total.toFixed(2)}</p>
        <div className="space-y-2">
          <button
            onClick={onRegisterSale}
            disabled={cart.length === 0}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg"
          >
            Registrar (Efectivo)
          </button>
          <button
            onClick={onShowQR}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg"
          >
            <QrCodeIcon className="h-6 w-6 mr-2" />
            Pagar con MP (QR)
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal de la página
const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pendingSale, setPendingSale] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      // Filtrar productos con stock disponible para la grilla
      setProducts(data);
      // Resetear carrito si algún producto se quedó sin stock después del refresh
      setCart(prevCart => {
        return prevCart.filter(cartItem => {
          const productInList = data.find(p => p._id === cartItem.productId);
          return productInList && productInList.stock > 0;
        });
      });

    } catch (error) {
      toast.error('Error al cargar productos (simulado)');
      console.error('Error en fetchProducts (POS Page):', error);
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
        toast.error(`Stock máximo (${stockAvailable}) alcanzado para ${product.name}`);
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
        stock: product.stock // Guardamos el stock original/máximo en el carrito
      }];
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleRegisterSale = async () => {
    if (cart.length === 0) return;
    const toastId = toast.loading('Registrando venta...');

    try {
      await saleService.createSale({
        items: cart.map(item => ({ product: item.productId, name: item.name, quantity: item.quantity, price: item.price })),
        total: total,
        paymentMethod: 'Efectivo',
        status: 'Completed'
      });
      toast.success('Venta registrada (Efectivo)', { id: toastId });
      setCart([]);
      fetchProducts(); // Actualizar productos y stock
    } catch (error) {
      toast.error('Error al registrar la venta (simulado)', { id: toastId });
    }
  };

  const handleInitiateQRPayment = async () => {
    if (cart.length === 0) return;
    const toastId = toast.loading('Iniciando pago...');

    try {
      const saleData = {
        items: cart.map(item => ({
          product: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: total,
        paymentMethod: 'MercadoPago',
        status: 'AwaitingPayment'
      };

      const newSale = await saleService.createSale(saleData);

      setPendingSale(newSale);
      setShowQRModal(true);
      toast.dismiss(toastId);

    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al iniciar la venta. Intente de nuevo.');
      console.error("Error creating pending sale:", error);
    }
  };

  const handlePaymentSuccess = (paidSale) => {
    toast.success('Venta registrada (Mercado Pago)');
    setCart([]);
    fetchProducts(); // Actualizar productos y stock
    setShowQRModal(false);
    setPendingSale(null);
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setPendingSale(null);
    // Nota: En un entorno real, al cerrar el modal, deberías cancelar la venta pendiente
    // en la base de datos o dejarla expirar. Aquí solo reseteamos el estado.
  };

  // 3. Código de renderizado (completo)
  return (
    <div className="p-4 h-screen max-h-screen overflow-hidden bg-gray-900 text-white font-sans">

      {showQRModal && pendingSale && (
        <PosQRModal
          saleId={pendingSale._id}
          items={pendingSale.items}
          totalAmount={pendingSale.total}
          onClose={handleQRModalClose}
          onPaymentSuccess={handlePaymentSuccess}
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
            onShowQR={handleInitiateQRPayment}
          />
        </div>
      </div>
    </div>
  );
};

export default PosPage;
