import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const ReportsManager = () => {
    const [revenueData, setRevenueData] = useState(null);
    const [topProductsData, setTopProductsData] = useState(null);
    const [courtOccupancyData, setCourtOccupancyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const [revenueRes, topProductsRes, courtOccupancyRes] = await Promise.all([
                    axios.get('/reports/sales-revenue-last-30-days'),
                    axios.get('/reports/top-selling-products'),
                    axios.get('/reports/court-occupancy')
                ]);

                // Procesar datos para el gráfico de ingresos
                const revenueLabels = revenueRes.data.map(d => new Date(d._id).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'}));
                const revenueValues = revenueRes.data.map(d => d.total);
                setRevenueData({
                    labels: revenueLabels,
                    datasets: [{
                        label: 'Ingresos por Ventas ($)',
                        data: revenueValues,
                        borderColor: '#00C9A7',
                        backgroundColor: 'rgba(0, 201, 167, 0.2)',
                        fill: true,
                    }]
                });

                // Procesar datos para el gráfico de top productos
                const productLabels = topProductsRes.data.map(p => p.productDetails.name);
                const productValues = topProductsRes.data.map(p => p.totalQuantity);
                setTopProductsData({
                    labels: productLabels,
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: productValues,
                        backgroundColor: ['#FF6700', '#FF8D3B', '#FFB174', '#FFD5AD', '#FFF0E6'],
                    }]
                });

                // Procesar datos para el gráfico de ocupación de canchas
                const courtLabels = courtOccupancyRes.data.map(c => c.courtDetails.name);
                const courtValues = courtOccupancyRes.data.map(c => c.count);
                setCourtOccupancyData({
                    labels: courtLabels,
                    datasets: [{
                        label: 'Nº de Reservas',
                        data: courtValues,
                        backgroundColor: ['#1B263B', '#4A698C', '#778DA9', '#A3B9D2', '#D0E1F0'],
                        borderColor: '#E0E1DD',
                        borderWidth: 1,
                    }]
                });

            } catch (err) {
                setError('No se pudieron cargar los datos de los reportes.');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <p className="text-center">Cargando reportes...</p>;
    if (error) return <p className="text-danger text-center">{error}</p>;

    return (
        <div className="animate-fade-in space-y-8">
            <h3 className="text-3xl font-bold mb-4 text-secondary text-center">Reportes Visuales</h3>

            {/* Gráfico de Ingresos */}
            <div className="bg-dark-secondary p-6 rounded-lg">
                <h4 className="text-xl font-bold mb-4">Ingresos por Ventas (Últimos 30 días)</h4>
                {revenueData && <Line options={{ responsive: true }} data={revenueData} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Top Productos */}
                <div className="bg-dark-secondary p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-4">Top 5 Productos Más Vendidos</h4>
                    {topProductsData && <Bar options={{ responsive: true, indexAxis: 'y' }} data={topProductsData} />}
                </div>

                {/* Gráfico de Ocupación de Canchas */}
                <div className="bg-dark-secondary p-6 rounded-lg">
                    <h4 className="text-xl font-bold mb-4">Ocupación por Cancha (Total)</h4>
                    {courtOccupancyData && <Doughnut options={{ responsive: true }} data={courtOccupancyData} />}
                </div>
            </div>
        </div>
    );
};

export default ReportsManager;