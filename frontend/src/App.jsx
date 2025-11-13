import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AdminLayout from './pages/admin/AdminLayout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/Navbar';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import { usePublicSettings } from './contexts/PublicSettingsContext'; // --- IMPORTADO ---

// Componente para el layout de las páginas públicas
const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet /> 
  </>
);

// --- NUEVO COMPONENTE DE RUTA PROTEGIDA PARA LA TIENDA ---
const ShopRoute = () => {
  const { settings } = usePublicSettings();
  
  if (!settings.shopEnabled) {
    // Si la tienda está deshabilitada, redirige al inicio
    return <Navigate to="/" replace />;
  }
  
  // Si está habilitada, muestra la tienda
  return <ShopPage />;
};
// ----------------------------------------------------

function App() {
  return (
    <Routes>
      {/* Rutas Públicas con Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        
        {/* --- RUTA MODIFICADA --- */}
        <Route path="/shop" element={<ShopRoute />} />
        {/* ----------------------- */}
        
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-failure" element={<PaymentFailurePage />} />
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
