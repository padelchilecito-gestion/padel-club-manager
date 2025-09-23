import React, { useState, useEffect, useCallback } from 'react'; // 'useCallback' puede que ya esté
import axios from 'axios';
import QRCode from "react-qr-code";
import { socket } from './NotificationProvider';

const SalesManager = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrCodeValue, setQrCodeValue] = useState('');
    const [currentPendingId, setCurrentPendingId] = useState(null);
    const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await axios.get('/products');
            setProducts(res.data);
        } catch (err) {
            setError('No se pudieron cargar los productos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        const handlePaymentSuccess = ({ pendingId }) => {
            if (pendingId === currentPendingId) {
                alert('¡Pago recibido con éxito!');
                setIsQrModalOpen(false);
                setQrCodeValue('');
                setCart([]);
                setCurrentPendingId(null);
                setIsWaitingForPayment(false);
                fetchProducts(); // Para actualizar el stock visualmente
            }
        };

        socket.on('pos_payment_success', handlePaymentSuccess);

        return () => {
            socket.off('pos_payment_success', handlePaymentSuccess);
        };
    }, [currentPendingId, fetchProducts]);

    const handleGenerateQR = async () => {
        if (cart.length === 0) return;

        const saleData = {
            // Pasamos el nombre para que se muestre en el checkout de MP
            items: cart.map(item => ({
                product: item.product._id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            })),
            total: total
        };

        try {
            setIsWaitingForPayment(true);
            const res = await axios.post('/payments/create-pos-preference', saleData);
            setQrCodeValue(res.data.init_point);
            setCurrentPendingId(res.data.pendingId);
            setIsQrModalOpen(true);
        } catch (err) {
            setError('No se pudo generar el código QR. Inténtalo de nuevo.');
            setIsWaitingForPayment(false);
        }
    };

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product._id === product._id);
            if (existingItem) {
                // Incrementar cantidad si ya está en el carrito
                return prevCart.map(item =>
                    item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                // Agregar nuevo item al carrito
                return [...prevCart, { product, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.product._id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const handleFinalizeSale = async () => {
        if (cart.length === 0) return;

        const saleData = {
            items: cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            })),
            total: total,
            paymentMethod: paymentMethod
        };

        if (window.confirm(`Confirmar venta por un total de $${total} en ${paymentMethod}?`)) {
            console.log("Enviando datos de venta:", saleData);
            try {
                await axios.post('/sales', saleData);
                alert('¡Venta registrada con éxito!');
                setCart([]);
                fetchProducts(); // Recargar productos para ver el stock actualizado
            } catch (err) {
                console.error("Error detallado:", err.response?.data || err.message);
                setError(err.response?.data?.message || 'Error al registrar la venta. El stock podría no haber sido suficiente.');
            }
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
    );

    return (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna de Productos */}
            <div>
                <h3 className="text-xl font-bold mb-4 text-secondary">Productos Disponibles</h3>
                <input 
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 mb-4 bg-dark-primary rounded"
                />
                {loading ? <p>Cargando...</p> : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredProducts.map(product => (
                            <div key={product._id} className="bg-dark-secondary p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{product.name}</p>
                                    <p className="text-sm text-secondary">${product.price} <span className="text-text-secondary">(Stock: {product.stock})</span></p>
                                </div>
                                <button onClick={() => addToCart(product)} className="bg-primary text-white font-bold py-1 px-3 rounded-lg hover:bg-primary-dark">+</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Columna del Carrito de Ventas */}
            <div className="bg-dark-secondary p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-white">Carrito de Venta</h3>
                <div className="space-y-3 min-h-[40vh]">
                    {cart.length > 0 ? cart.map(item => (
                        <div key={item.product._id} className="flex items-center gap-4">
                            <div className="flex-grow">
                                <p className="font-bold">{item.product.name}</p>
                                <p className="text-sm text-text-secondary">${item.product.price} c/u</p>
                            </div>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateQuantity(item.product._id, parseInt(e.target.value, 10))}
                                className="w-16 p-1 bg-dark-primary rounded text-center"
                                min="1"
                                max={item.product.stock}
                            />
                            <button onClick={() => removeFromCart(item.product._id)} className="text-danger">✖</button>
                        </div>
                    )) : <p className="text-text-secondary">Agrega productos para iniciar una venta.</p>}
                </div>
                <div className="border-t border-gray-600 pt-4 mt-4 space-y-4">
                    <div className="flex justify-between font-bold text-2xl">
                        <span>TOTAL:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div>
                        <label htmlFor="paymentMethod" className="text-sm text-text-secondary">Método de Pago</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full mt-1 p-2 bg-dark-primary rounded"
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="MercadoPago">Mercado Pago</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateQR}
                        disabled={cart.length === 0 || isWaitingForPayment}
                        className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isWaitingForPayment ? 'Esperando pago...' : 'Cobrar con QR de Mercado Pago'}
                    </button>

                    <button 
                        onClick={handleFinalizeSale}
                        disabled={cart.length === 0}
                        className="w-full bg-secondary text-dark-primary font-bold py-3 rounded-lg hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Finalizar Venta ({paymentMethod})
                    </button>
                </div>
            </div>
            {isQrModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg text-center">
                        <h3 className="text-2xl font-bold mb-4 text-dark-primary">Escanea para Pagar</h3>
                        <div style={{ background: 'white', padding: '16px' }}>
                            <QRCode value={qrCodeValue} />
                        </div>
                        <p className="text-dark-primary font-bold text-2xl mt-4">${total.toFixed(2)}</p>
                        <button
                            onClick={() => {
                                setIsQrModalOpen(false);
                                setIsWaitingForPayment(false);
                                setCurrentPendingId(null);
                            }}
                            className="w-full bg-gray-600 text-white py-2 rounded-lg mt-6 hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesManager;