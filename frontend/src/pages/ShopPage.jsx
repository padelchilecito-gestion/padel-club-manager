import React, { useState, useEffect } from 'react';
import { ShoppingCartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const categories = ['Todos', 'Bebidas', 'Snacks', 'Accesorios', 'Ropa'];

  // Mock data
  useEffect(() => {
    const mockProducts = [
      { id: 1, name: 'Gatorade', category: 'Bebidas', price: 800, stock: 25, image: '🥤' },
      { id: 2, name: 'Agua Mineral', category: 'Bebidas', price: 500, stock: 30, image: '💧' },
      { id: 3, name: 'Coca Cola', category: 'Bebidas', price: 700, stock: 20, image: '🥤' },
      { id: 4, name: 'Red Bull', category: 'Bebidas', price: 1200, stock: 15, image: '🥫' },
      { id: 5, name: 'Papas Fritas', category: 'Snacks', price: 600, stock: 40, image: '🍟' },
      { id: 6, name: 'Barras de Cereal', category: 'Snacks', price: 450, stock: 35, image: '🍫' },
      { id: 7, name: 'Chocolate', category: 'Snacks', price: 800, stock: 25, image: '🍫' },
      { id: 8, name: 'Paleta de Padel Pro', category: 'Accesorios', price: 35000, stock: 5, image: '🎾' },
      { id: 9, name: 'Pelotas Pack x3', category: 'Accesorios', price: 3500, stock: 15, image: '⚾' },
      { id: 10, name: 'Grip Antideslizante', category: 'Accesorios', price: 1200, stock: 20, image: '🎯' },
      { id: 11, name: 'Remera Deportiva', category: 'Ropa', price: 8000, stock: 12, image: '👕' },
      { id: 12, name: 'Short Deportivo', category: 'Ropa', price: 7500, stock: 10, image: '🩳' },
    ];
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary">
      {/* Header */}
      <header className="bg-dark-secondary/80 backdrop-blur-sm shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Tienda del Club
              </h1>
              <p className="text-text-secondary mt-1">Todo lo que necesitas para tu juego</p>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative px-6 py-3 bg-gradient-to-r from-secondary to-primary text-dark-primary font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              <span>Carrito</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-secondary text-text-primary pl-12 pr-4 py-4 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'bg-dark-secondary text-text-secondary hover:bg-primary/20 hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-dark-secondary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 h-40 flex items-center justify-center text-6xl">
                {product.image}
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs text-text-secondary uppercase">{product.category}</span>
                  <h3 className="text-lg font-bold text-text-primary truncate">{product.name}</h3>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-secondary">${product.price}</p>
                    <p className="text-xs text-text-secondary">Stock: {product.stock}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                  >
                    {product.stock === 0 ? 'Agotado' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-text-secondary">No se encontraron productos</p>
          </div>
        )}
      </main>

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowCart(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-dark-secondary shadow-2xl z-40 flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">Tu Carrito</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-text-secondary hover:text-text-primary text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-text-secondary">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-dark-primary rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-text-primary">{item.name}</h3>
                          <p className="text-sm text-secondary">${item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-600 rounded-full hover:bg-gray-500 font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 bg-primary rounded-full hover:bg-primary-dark font-bold disabled:bg-gray-600"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-text-primary">${item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-text-primary">Total:</span>
                  <span className="text-3xl font-bold text-secondary">${cartTotal}</span>
                </div>
                <button className="w-full py-4 bg-gradient-to-r from-secondary to-primary text-dark-primary font-bold rounded-lg hover:shadow-2xl hover:scale-105 transition-all">
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ShopPage;