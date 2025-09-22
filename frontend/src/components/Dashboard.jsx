import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Pequeños componentes "Widget" para organizar la información
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-dark-secondary p-6 rounded-lg shadow-lg flex items-center gap-4">
        <div className={`text-3xl ${color}`}>
            <i className={icon}></i>
        </div>
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/dashboard');
                setData(res.data);
            } catch (err) {
                setError('No se pudo cargar la información del dashboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Función para obtener la clase CSS según el estado de la reserva
    const getStatusClass = (status) => {
        if (status === 'Confirmed') return 'status-confirmed';
        if (status === 'Pending') return 'status-pending';
        return 'bg-gray-500';
    };

    if (loading) return <p className="text-center p-8">Cargando dashboard...</p>;
    if (error) return <p className="text-danger text-center p-8">{error}</p>;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Sección de Estadísticas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Ingresos de Hoy" 
                    value={`$${data.dailyRevenue.toFixed(2)}`}
                    icon="fas fa-dollar-sign"
                    color="text-secondary"
                />
                <StatCard 
                    title="Próximas Reservas" 
                    value={data.upcomingBookings.length}
                    icon="fas fa-calendar-check"
                    color="text-blue-400"
                />
                <StatCard 
                    title="Alertas de Stock" 
                    value={data.lowStockProducts.length}
                    icon="fas fa-exclamation-triangle"
                    color="text-yellow-400"
                />
            </div>

            {/* Columnas para Próximas Reservas y Bajo Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Próximas Reservas */}
                <div className="bg-dark-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-white">Próximas 5 Reservas</h3>
                    <div className="space-y-3">
                        {data.upcomingBookings.length > 0 ? data.upcomingBookings.map(booking => (
                             <div key={booking._id} className="bg-dark-primary p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{booking.user.name}</p>
                                    <p className="text-sm text-text-secondary">{booking.court.name} - {new Date(booking.startTime).toLocaleDateString('es-AR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-secondary mb-1">{new Date(booking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</p>
                                    {/* ⭐ MODIFICADO: Se añade la etiqueta de estado */}
                                    <span className={getStatusClass(booking.status)}>
                                        {booking.status === 'Confirmed' ? 'Confirmado' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>
                        )) : <p className="text-text-secondary">No hay próximas reservas.</p>}
                    </div>
                </div>

                {/* Productos con Bajo Stock */}
                <div className="bg-dark-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-white">Productos con Bajo Stock</h3>
                     <div className="space-y-3">
                        {data.lowStockProducts.length > 0 ? data.lowStockProducts.map(product => (
                             <div key={product._id} className="bg-dark-primary p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{product.name}</p>
                                    <p className="text-sm text-text-secondary">{product.category}</p>
                                </div>
                                <p className="font-bold text-yellow-400">Stock: {product.stock}</p>
                            </div>
                        )) : <p className="text-text-secondary">No hay productos con bajo stock.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;