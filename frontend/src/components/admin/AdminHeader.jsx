import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/solid'; // <-- Bars3Icon añadido

const AdminHeader = ({ setIsSidebarOpen }) => { // <-- Recibe prop
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-secondary shadow-md p-4 flex justify-between items-center z-10">
      <div className="flex items-center">
        {/* Botón de Hamburguesa (solo en móvil) */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="text-text-primary p-2 mr-2 md:hidden" // <-- visible solo en móvil (md:hidden)
          title="Abrir menú"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        
        <h1 className="text-lg md:text-xl font-semibold text-text-primary">Panel de Administración</h1>
      </div>
      <div className="flex items-center">
        <span className="text-text-secondary mr-2 md:mr-4 text-sm md:text-base">
          Hola, <span className="font-bold text-text-primary">{user?.username}</span>
          <span className="hidden sm:inline"> ({user?.role})</span> {/* Oculta rol en pantallas muy chicas */}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          title="Cerrar Sesión"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
