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
import SalesHistoryPage from './SalesHistoryPage';

// Import route protectors
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AdminRoute from '../../components/auth/AdminRoute';


const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-dark-primary text-text-primary overflow-hidden">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-30 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-primary p-4 md:p-6">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
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
