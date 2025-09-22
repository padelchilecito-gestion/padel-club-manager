import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const InventoryManager = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({ name: '', category: 'Bebidas', price: '', stock: '', trackStockAlert: true });
    const [imageFile, setImageFile] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/products');
            setProducts(res.data);
        } catch (err) {
            setError('No se pudieron cargar los productos. Intenta recargar la página.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFileChange = e => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('stock', formData.stock);
        data.append('trackStockAlert', formData.trackStockAlert);
        if (imageFile) {
            data.append('image', imageFile);
        }

        // ⭐ CORRECCIÓN CLAVE:
        // Nos aseguramos de que el `Content-Type` sea `multipart/form-data`
        // solo cuando se envía una imagen.
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };

        const action = editingId 
            ? axios.put(`/products/${editingId}`, data, config)
            : axios.post('/products', data, config);
        
        try {
            await action;
            fetchProducts();
            resetForm();
        } catch (err) {
            setError(`Error al ${editingId ? 'actualizar' : 'crear'} el producto.`);
        }
    };
    
    const handleEdit = product => {
        setFormData({ 
            name: product.name, 
            category: product.category, 
            price: product.price, 
            stock: product.stock,
            trackStockAlert: product.trackStockAlert !== undefined ? product.trackStockAlert : true
        });
        setEditingId(product._id);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await axios.delete(`/products/${id}`);
                setProducts(products.filter(p => p._id !== id));
            } catch (err) {
                setError('Error al eliminar el producto.');
            }
        }
    };
    
    const resetForm = () => {
        setFormData({ name: '', category: 'Bebidas', price: '', stock: '', trackStockAlert: true });
        setImageFile(null);
        setEditingId(null);
        if (document.getElementById('image-file-input')) {
            document.getElementById('image-file-input').value = '';
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-secondary">
                {editingId ? 'Editando Producto' : 'Agregar Nuevo Producto'}
            </h3>
            
            {error && <p className="text-danger bg-red-900/50 p-3 rounded-lg mb-4 text-center">{error}</p>}
            
            <form onSubmit={handleSubmit} className="bg-dark-secondary p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="productName" className="text-sm text-text-secondary">Nombre del producto</label>
                    <input type="text" id="productName" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2" required />
                </div>
                <div>
                    <label htmlFor="productCategory" className="text-sm text-text-secondary">Categoría</label>
                    <select id="productCategory" name="category" value={formData.category} onChange={handleChange} className="w-full mt-1 p-2">
                        <option>Bebidas</option>
                        <option>Snacks</option>
                        <option>Paletas</option>
                        <option>Accesorios</option>
                        <option>Otros</option>
                    </select>
                </div>
                <div className="flex gap-4">
                    <div className="w-1/2">
                       <label htmlFor="productPrice" className="text-sm text-text-secondary">Precio ($)</label>
                       <input type="number" id="productPrice" name="price" value={formData.price} onChange={handleChange} className="w-full mt-1 p-2" required min="0" />
                    </div>
                     <div className="w-1/2">
                       <label htmlFor="productStock" className="text-sm text-text-secondary">Stock</label>
                       <input type="number" id="productStock" name="stock" value={formData.stock} onChange={handleChange} className="w-full mt-1 p-2" required min="0" />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="image-file-input" className="block text-sm text-text-secondary mb-1">Imagen del Producto (Opcional)</label>
                    <input type="file" id="image-file-input" name="image" onChange={handleFileChange} className="w-full text-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"/>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 bg-dark-primary p-3 rounded-lg">
                    <input
                        type="checkbox"
                        id="trackStockAlert"
                        name="trackStockAlert"
                        checked={formData.trackStockAlert}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor="trackStockAlert" className="text-sm text-text-secondary">
                        Mostrar alerta de bajo stock para este producto en el Dashboard
                    </label>
                </div>

                <div className="flex gap-4 md:col-span-2">
                    <button type="submit" className="flex-grow bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark transition">{editingId ? 'Actualizar Producto' : 'Agregar Producto'}</button>
                    {editingId && <button type="button" onClick={resetForm} className="flex-grow bg-text-secondary text-dark-primary font-bold py-2 px-4 rounded">Cancelar</button>}
                </div>
            </form>

            <h3 className="text-xl font-bold mb-4 text-secondary">Lista de Productos</h3>
            {loading ? <p className="text-center">Cargando productos...</p> : (
                <div className="space-y-3">
                    {products.map(product => (
                        <div key={product._id} className="bg-dark-secondary p-4 rounded-lg flex items-center gap-4">
                            {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md"/>}
                            <div className="flex-grow">
                                <p className="font-bold text-text-primary">{product.name} <span className="font-normal text-xs text-text-secondary bg-dark-primary px-2 py-1 rounded-full">{product.category}</span></p>
                                <p className="text-sm text-secondary font-semibold">${product.price} - Stock: {product.stock}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(product)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Editar</button>
                                <button onClick={() => handleDelete(product._id)} className="bg-danger text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryManager;