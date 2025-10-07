import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-dark-secondary shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-primary">
        <NavLink to="/">Padel Club</NavLink>
      </div>
      <div className="flex items-center gap-6">
        <NavLink
          to="/shop"
          className="text-text-secondary hover:text-primary transition-colors"
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
    </nav>
  );
};

export default Navbar;