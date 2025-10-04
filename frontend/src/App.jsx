import { Routes, Route, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AdminLayout from './pages/admin/AdminLayout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/Navbar'; // Importa la nueva Navbar

// Componente para el layout de las páginas públicas
const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet /> {/* Aquí se renderizarán HomePage y ShopPage */}
  </>
);

function App() {
  return (
    <Routes>
      {/* Rutas Públicas con Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Route>

      {/* Rutas sin Navbar */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas de Admin */}
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