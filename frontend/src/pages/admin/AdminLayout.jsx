import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
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
import SalesHistoryPage from './SalesHistoryPage';

// Import route protectors
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AdminRoute from '../../components/auth/AdminRoute';


const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-dark-primary text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-primary p-6">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* Routes for Operator and Admin */}
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="pos" element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="courts" element={<ProtectedRoute><CourtsPage /></ProtectedRoute>} />
            <Route path="cashbox" element={<ProtectedRoute><CashboxPage /></ProtectedRoute>} />

            {/* Routes for Admin only */}
            <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="sales" element={<AdminRoute><SalesHistoryPage /></AdminRoute>} />
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
