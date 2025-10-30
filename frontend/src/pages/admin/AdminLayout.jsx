// frontend/src/pages/admin/AdminLayout.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import DashboardPage from './DashboardPage';
import BookingsPage from './BookingsPage';
import CourtsPage from './CourtsPage';
import InventoryPage from './InventoryPage';
import PosPage from './PosPage';
import CashboxPage from './CashboxPage';
import SalesHistoryPage from './SalesHistoryPage';
import UsersPage from './UsersPage';
import ReportsPage from './ReportsPage';
import ActivityLogPage from './ActivityLogPage';
import SettingsPage from './SettingsPage'; // <-- CORRECCIÓN 1: Importar SettingsPage

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Routes>
            {/* La ruta base "/admin" se maneja aquí */}
            <Route path="/" element={<DashboardPage />} /> 
            
            {/* React Router v6 maneja rutas anidadas relativas al 'path' del padre.
              En App.jsx, el padre es "/admin/*".
              Por lo tanto, "bookings" aquí equivale a "/admin/bookings".
            */}
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/courts" element={<CourtsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/cashbox" element={<CashboxPage />} />
            <Route path="/sales-history" element={<SalesHistoryPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/activity-log" element={<ActivityLogPage />} />

            {/* --- CORRECCIÓN 2: Añadir la ruta de Settings --- */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Redirigir cualquier ruta desconocida dentro de /admin al Dashboard */}
            <Route path="*" element={<Navigate to="/admin" replace />} /> 
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
