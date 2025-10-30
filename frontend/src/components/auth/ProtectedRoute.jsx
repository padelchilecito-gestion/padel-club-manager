// frontend/src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FullPageLoading } from '../ui/Feedback';

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <FullPageLoading text="Verificando sesión..." />;
  }

  if (!user) {
    // No logueado, redirigir a login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- CORRECCIÓN: AÑADIR VALIDACIÓN DE ROL ---
  // El usuario está logueado, pero ¿es Admin u Operator?
  const isAdminOrOperator = user.role === 'Admin' || user.role === 'Operator';

  if (!isAdminOrOperator) {
    // Logueado pero NO es admin/operator, redirigir a la página principal
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // Si 'user' existe Y es Admin/Operator, permite el acceso
  return children; 
};

export default ProtectedRoute;
