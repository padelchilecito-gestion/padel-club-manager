import React, { useState } from 'react'; // <-- Se añadió useState
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import DashboardPage from './DashboardPage';
import BookingsPage from './BookingsPage';
import PosPage from './PosPage';
import InventoryPage from './InventoryPage';
import CourtsPage from './CourtsPage';
import UsersPage from './UsersPage';
import ReportsPage from './ReportsPage';
import ActivityLogPage from './ActivityLogPage';
import SettingsPage from './SettingsPage';
import CashboxPage from './CashboxPage';
import RecurringBookingsPage from './RecurringBookingsPage'; 

// Import route protectors
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AdminRoute from '../../components/auth/AdminRoute';


const AdminLayout = () => {
  // Estado para el menú móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-dark-primary text-text-primary">
      
      {/* Sidebar (ahora recibe estado) */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      {/* Overlay para móvil (cierra el menú al tocar fuera) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (ahora recibe el setter para abrir el menú) */}
        <AdminHeader setIsSidebarOpen={setIsSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-dark-primary p-4 md:p-6"> {/* Padding ajustado para móvil */}
          <Routes>
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* Routes for Operator and Admin */}
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="recurring-bookings" element={<ProtectedRoute><RecurringBookingsPage /></ProtectedRoute>} />
            <Route path="pos" element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
            <Route path="cashbox" element={<ProtectedRoute><CashboxPage /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="courts" element={<ProtectedRoute><CourtsPage /></ProtectedRoute>} />

            {/* Routes for Admin only */}
            <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
            <Route path="logs" element={<AdminRoute><ActivityLogPage /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />

            {/* Fallback for any other admin route */}
            <Route path="*" element={<h1 className="text-white">Página no encontrada en el panel</h1>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
