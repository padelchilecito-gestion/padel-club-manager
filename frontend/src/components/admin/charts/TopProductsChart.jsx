import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { reportService } from '../../../services/reportService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopProductsChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProductsData = async () => {
      try {
        const data = await reportService.getTopSellingProducts();
        
        const labels = data.map(p => p.name);
        const quantities = data.map(p => p.totalQuantity);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Unidades Vendidas',
              data: quantities,
              backgroundColor: '#00C9A7', // secondary
            },
          ],
        });
      } catch (error) {
        console.error("Failed to fetch top products data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProductsData();
  }, []);

  const options = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
        x: {
            ticks: { color: '#778DA9' }
        },
        y: {
            ticks: { color: '#E0E1DD' } // text-primary
        }
    }
  };

  if (loading) return <p className="text-text-secondary">Cargando gráfico...</p>;
  if (!chartData || chartData.labels.length === 0) return <p className="text-text-secondary">No hay datos de ventas de productos todavía.</p>;

  return <Bar options={options} data={chartData} />;
};

export default TopProductsChart;
