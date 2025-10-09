import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = "text-text-secondary hover:text-primary transition-colors";
  const activeNavLinkClasses = "text-primary";

  return (
    <nav className="bg-dark-secondary shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-primary">
        <NavLink to="/">Padel Club</NavLink>
      </div>
      <div className="flex items-center gap-6">
        <NavLink
          to="/shop"
          className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
        >
          Tienda
        </NavLink>
        <NavLink
          to="/gallery"
          className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
        >
          Fotos del Predio
        </NavLink>

        {user ? (
          <>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
              >
                Admin
              </NavLink>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center text-text-secondary hover:text-primary transition-colors"
              title="Cerrar Sesión"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Salir</span>
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;