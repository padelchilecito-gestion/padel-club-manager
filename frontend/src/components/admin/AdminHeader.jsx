import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/solid';

const AdminHeader = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-secondary shadow-md p-4 flex justify-between items-center z-10">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-white md:hidden mr-4">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-text-primary hidden sm:block">
          Panel de Administración
        </h1>
      </div>
      <div className="flex items-center">
        <span className="text-text-secondary mr-4">
          Hola, <span className="font-bold text-text-primary">{user?.username}</span> ({user?.role})
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