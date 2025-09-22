import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BookingManager from './BookingManager';
import InventoryManager from './InventoryManager';
import CourtManager from './CourtManager';
import SettingsManager from './SettingsManager';
import SalesManager from './SalesManager';
import ReportsManager from './ReportsManager';
import Dashboard from './Dashboard';
import UserManager from './UserManager';
import ActivityLogViewer from './ActivityLogViewer';
import CashboxManager from './CashboxManager'; // <-- Importar el nuevo componente de Caja

const AdminDashboard = () => {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Estilos para reutilizar en cada botón
    const tabStyle = "px-4 py-3 font-bold transition-colors text-text-secondary hover:text-primary";
    const activeTabStyle = "text-primary border-b-2 border-primary";

    return (
        <div>
            <div className="flex border-b border-gray-700 mb-6 flex-wrap">
                {/* Pestañas visibles para todos los roles (Admin y Operator) */}
                <button onClick={() => setActiveTab('dashboard')} className={`${tabStyle} ${activeTab === 'dashboard' && activeTabStyle}`}>
                    Dashboard
                </button>
                <button onClick={() => setActiveTab('cashbox')} className={`${tabStyle} ${activeTab === 'cashbox' && activeTabStyle}`}>
                    Caja
                </button>
                <button onClick={() => setActiveTab('sales')} className={`${tabStyle} ${activeTab === 'sales' && activeTabStyle}`}>
                    Punto de Venta
                </button>
                <button onClick={() => setActiveTab('bookings')} className={`${tabStyle} ${activeTab === 'bookings' && activeTabStyle}`}>
                    Turnos
                </button>
                <button onClick={() => setActiveTab('courts')} className={`${tabStyle} ${activeTab === 'courts' && activeTabStyle}`}>
                    Canchas
                </button>
                
                {/* Pestañas que SOLO los Administradores pueden ver */}
                {isAdmin && (
                    <>
                        <button onClick={() => setActiveTab('inventory')} className={`${tabStyle} ${activeTab === 'inventory' && activeTabStyle}`}>
                            Inventario
                        </button>
                        <button onClick={() => setActiveTab('reports')} className={`${tabStyle} ${activeTab === 'reports' && activeTabStyle}`}>
                            Reportes
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`${tabStyle} ${activeTab === 'users' && activeTabStyle}`}>
                            Usuarios
                        </button>
                        <button onClick={() => setActiveTab('logs')} className={`${tabStyle} ${activeTab === 'logs' && activeTabStyle}`}>
                            Log de Actividad
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`${tabStyle} ${activeTab === 'settings' && activeTabStyle}`}>
                            Configuración
                        </button>
                    </>
                )}
            </div>

            {/* Renderizado condicional del componente activo */}
            <div>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'cashbox' && <CashboxManager />}
                {activeTab === 'sales' && <SalesManager />}
                {activeTab === 'bookings' && <BookingManager />}
                {activeTab === 'courts' && <CourtManager />}

                {/* Se asegura que solo los admins puedan renderizar estos componentes */}
                {isAdmin && activeTab === 'inventory' && <InventoryManager />}
                {isAdmin && activeTab === 'reports' && <ReportsManager />}
                {isAdmin && activeTab === 'users' && <UserManager />}
                {isAdmin && activeTab === 'logs' && <ActivityLogViewer />}
                {isAdmin && activeTab === 'settings' && <SettingsManager />}
            </div>
        </div>
    );
};

export default AdminDashboard;