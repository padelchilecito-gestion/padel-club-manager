import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AdminLayout from './pages/admin/AdminLayout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './components/PublicLayout'; // 1. Importa el nuevo Layout

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}> {/* 2. Envuelve las rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Route>

      {/* Rutas sin el Navbar público */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;