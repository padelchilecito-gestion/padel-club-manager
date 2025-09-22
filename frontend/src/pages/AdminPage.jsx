import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import { useNavigate } from 'react-router-dom';
import { NotificationProvider } from '../components/NotificationProvider'; // <-- 1. IMPORTAR

const AdminPage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        // 2. Envolvemos todo con el NotificationProvider
        <NotificationProvider>
            <div className="container mx-auto p-4 md:p-8">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-secondary">Modo Administrador</h2>
                    <button 
                        onClick={handleLogout} 
                        className="bg-danger text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
                    >
                        Cerrar Sesión
                    </button>
                </div>
                <AdminDashboard />
            </div>
        </NotificationProvider>
    );
};

export default AdminPage;