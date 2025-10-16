import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import * as settingService from './services/settingService';
import './App.css';

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const PublicLayout = lazy(() => import('./components/layout/PublicLayout'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function App() {
  const [clubSettings, setClubSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settings = await settingService.getPublicSettings();
        if (!settings.clubName || !settings.clubAddress) {
          throw new Error('La configuración del club no está completa. Por favor, contacta al administrador.');
        }
        setClubSettings(settings);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  if (loading) {
    return <div className="loading-container">Cargando...</div>;
  }

  // Si hay un error pero el usuario está intentando acceder al panel de admin, se lo permitimos.
  if (error && !window.location.pathname.startsWith('/admin')) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
        <p>Si eres el administrador, por favor <a href="/admin/settings">configura el club aquí</a>.</p>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<div className="loading-container">Cargando...</div>}>
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