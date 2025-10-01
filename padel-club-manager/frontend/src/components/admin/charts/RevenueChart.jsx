import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { reportService } from '../../../services/reportService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RevenueChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const data = await reportService.getRevenueLast30Days();

        const labels = data.map(d => d._id);
        const revenue = data.map(d => d.total);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Ingresos por Día',
              data: revenue,
              borderColor: '#FF6700', // primary
              backgroundColor: 'rgba(255, 103, 0, 0.2)',
              fill: true,
            },
          ],
        });
      } catch (error) {
        console.error("Failed to fetch revenue data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenueData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
        x: {
            ticks: { color: '#778DA9' } // text-secondary
        },
        y: {
            ticks: { color: '#778DA9' }
        }
    }
  };

  if (loading) return <p className="text-text-secondary">Cargando gráfico...</p>;
  if (!chartData) return <p className="text-danger">No se pudieron cargar los datos del gráfico.</p>;

  return <Line options={options} data={chartData} />;
};

export default RevenueChart;