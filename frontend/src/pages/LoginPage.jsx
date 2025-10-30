// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FullPageLoading, ErrorMessage } from '../components/ui/Feedback';

const LoginPage = () => {
  // CORREGIDO: Cambiar 'email' por 'username'
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const { login, authLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // CORREGIDO: Pasar 'username'
      await login(username, password); 
      
      // La redirección ahora se maneja en AuthContext
      // const from = location.state?.from?.pathname || '/admin';
      // navigate(from, { replace: true });

    } catch (err) {
      // El error ya se maneja y almacena en el AuthContext
      console.error(err.message); 
    }
  };

  if (authLoading && !error) {
    return <FullPageLoading text="Iniciando sesión..." />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-purple-400">
          Iniciar Sesión
        </h2>
        
        {error && (
          <ErrorMessage message={error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            {/* CORREGIDO: Label y htmlFor */}
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-400"
            >
              Usuario (Username)
            </label>
            <input
              // CORREGIDO: type, id, value, onChange
              type="text" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-400"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-4 py-2 font-semibold text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {authLoading ? 'Verificando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
