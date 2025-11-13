import React from 'react';
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
import RecurringBookingsPage from './RecurringBookingsPage'; // <-- AÑADIDO

// Import route protectors
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AdminRoute from '../../components/auth/AdminRoute';


const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-dark-primary text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-dark-primary p-6">
          <Routes>
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* Routes for Operator and Admin */}
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            {/* --- AÑADIDO --- */}
            <Route path="recurring-bookings" element={<ProtectedRoute><RecurringBookingsPage /></ProtectedRoute>} />
            {/* ---------------- */}
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
