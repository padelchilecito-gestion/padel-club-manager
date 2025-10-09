import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center my-8">
        <Link to="/" className="text-2xl font-bold text-primary">
          Padel Club Manager
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-text-secondary hover:text-primary">
                Home
              </Link>
            </li>
            <li>
              <Link to="/shop" className="text-text-secondary hover:text-primary">
                Shop
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-text-secondary hover:text-primary">
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="text-center mt-12 py-4 border-t border-gray-700">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default PublicLayout;