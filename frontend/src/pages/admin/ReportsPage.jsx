import React from 'react';
import RevenueChart from '../../components/admin/charts/RevenueChart';
import TopProductsChart from '../../components/admin/charts/TopProductsChart';
import CourtOccupancyChart from '../../components/admin/charts/CourtOccupancyChart';

const ReportsPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Reportes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-dark-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Ingresos de los últimos 30 días</h2>
          <RevenueChart />
        </div>
        <div className="bg-dark-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Top 5 Productos Más Vendidos</h2>
          <TopProductsChart />
        </div>
        <div className="bg-dark-secondary p-6 rounded-lg shadow-lg lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Ocupación por Cancha (últimos 30 días)</h2>
          <CourtOccupancyChart />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
