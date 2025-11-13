import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { reportService } from '../../../services/reportService';

ChartJS.register(ArcElement, Tooltip, Legend);

const CourtOccupancyChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOccupancyData = async () => {
      try {
        const data = await reportService.getCourtOccupancy();
        
        const labels = data.map(c => c.name);
        const hours = data.map(c => c.totalHours);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Horas Reservadas',
              data: hours,
              backgroundColor: [
                '#FF6700', // primary
                '#00C9A7', // secondary
                '#1B263B', // dark-secondary
                '#778DA9', // text-secondary
                '#D90429', // danger
                '#E05D00', // primary-dark
              ],
              borderColor: '#0D1B2A', // dark-primary
              borderWidth: 2,
            },
          ],
        });
      } catch (error) {
        console.error("Failed to fetch court occupancy data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOccupancyData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
            color: '#E0E1DD' // text-primary
        }
      },
      title: {
        display: false,
      },
    },
  };

  if (loading) return <p className="text-text-secondary">Cargando gráfico...</p>;
  if (!chartData || chartData.labels.length === 0) return <p className="text-text-secondary">No hay datos de ocupación de canchas todavía.</p>;

  return <div className="max-w-md mx-auto"><Doughnut options={options} data={chartData} /></div>;
};

export default CourtOccupancyChart;
