import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/sales');
        setSales(data);
        setError(null);
      } catch (err) {
        setError('Error al obtener el historial de ventas');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (loading) {
    return <p>Cargando historial de ventas...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Historial de Ventas</h1>
      {sales.length === 0 ? (
        <p>No hay ventas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-dark-secondary">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Método de Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <ul>
                      {sale.items.map(item => (
                        <li key={item._id}>{item.name} (x{item.quantity})</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${sale.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;