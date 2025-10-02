import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-dark-secondary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <NavLink to="/" className="text-2xl font-bold text-primary hover:text-primary-dark">
            Padel Club
          </NavLink>
          <div className="flex items-center space-x-6">
            <NavLink
              to="/shop"
              className="text-text-secondary hover:text-white transition-colors"
            >
              Tienda
            </NavLink>
            <NavLink
              to="/login"
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Login
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;