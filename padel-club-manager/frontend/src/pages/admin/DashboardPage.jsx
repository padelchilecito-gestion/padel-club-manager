import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import StatCard from '../../components/admin/StatCard';
import { CurrencyDollarIcon, CalendarIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await reportService.getDashboardData();
        setData(response);
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-danger">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={CurrencyDollarIcon}
          title="Ingresos del Día"
          value={`$${data?.dailyRevenue.toFixed(2) || '0.00'}`}
          color="text-secondary"
        />
        <StatCard
          icon={CalendarIcon}
          title="Próximas Reservas (24h)"
          value={data?.upcomingBookings.length || 0}
          color="text-primary"
        />
        <StatCard
          icon={ArchiveBoxXMarkIcon}
          title="Alertas de Stock"
          value={data?.lowStockProducts.length || 0}
          color="text-danger"
        />
      </div>

      {/* Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings List */}
        <div className="bg-dark-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Próximas Reservas</h2>
          {data?.upcomingBookings.length > 0 ? (
            <ul>
              {data.upcomingBookings.map(booking => (
                <li key={booking._id} className="flex justify-between items-center border-b border-gray-700 py-2">
                  <div>
                    <p className="font-semibold">{booking.user.name}</p>
                    <p className="text-sm text-text-secondary">{booking.court.name}</p>
                  </div>
                  <p className="font-mono text-primary">{format(new Date(booking.startTime), 'HH:mm')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary">No hay reservas próximas.</p>
          )}
        </div>

        {/* Low Stock List */}
        <div className="bg-dark-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Productos con Bajo Stock</h2>
          {data?.lowStockProducts.length > 0 ? (
            <ul>
              {data.lowStockProducts.map(product => (
                <li key={product._id} className="flex justify-between items-center border-b border-gray-700 py-2">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-danger">Quedan: {product.stock}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary">No hay productos con bajo stock.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;