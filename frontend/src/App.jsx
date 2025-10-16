import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import * as settingService from './services/settingService';
import './App.css';

// Lazy loading de los componentes principales
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const PublicLayout = lazy(() => import('./components/layout/PublicLayout'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Componente para la pantalla de carga
const LoadingScreen = () => (
  <div className="loading-container">Cargando...</div>
);

// Componente para la pantalla de error de configuración
const ConfigurationErrorScreen = () => (
  <div className="error-container">
    <h1>Configuración Requerida</h1>
    <p>La configuración del club no está completa.</p>
    <p>Si eres el administrador, por favor <a href="/admin/settings">configura el club aquí</a> para continuar.</p>
  </div>
);

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [clubSettings, setClubSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const settings = await settingService.getPublicSettings();
        // Verificamos que los datos esenciales existan y no estén vacíos
        if (settings && settings.clubName && settings.clubAddress) {
          setClubSettings(settings);
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        console.error("Error al verificar la configuración:", error);
        setIsConfigured(false); // Si hay un error de red, asumimos que no está configurado
      } finally {
        setLoading(false);
      }
    };

    checkConfiguration();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  // Si la ruta actual es del admin, renderizamos el Router completo para permitir el acceso
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/*" element={
              <AuthProvider>
                <AdminLayout />
              </AuthProvider>
            } />
            {/* Redirigimos cualquier otra ruta a la página de configuración si no está configurado */}
            <Route path="/*" element={!isConfigured ? <ConfigurationErrorScreen /> : <PublicLayout clubSettings={clubSettings} />} />
          </Routes>
        </Suspense>
      </Router>
    );
  }

  // Si no está configurado y no estamos en una ruta de admin, mostramos el error
  if (!isConfigured) {
    return <ConfigurationErrorScreen />;
  }

  // Si todo está correcto, renderizamos la aplicación normalmente
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/*" element={
            <AuthProvider>
              <AdminLayout />
            </AuthProvider>
          } />
          <Route path="/*" element={<PublicLayout clubSettings={clubSettings} />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;