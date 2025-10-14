import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Navigation Bar */}
      <nav className="bg-dark-secondary/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Padel Club
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`font-semibold transition-all ${
                  isActive('/')
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                Reservar Cancha
              </Link>
              <Link
                to="/shop"
                className={`font-semibold transition-all ${
                  isActive('/shop')
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                Tienda
              </Link>
              <Link
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
              >
                Admin
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-text-primary hover:text-primary transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-8 w-8" />
              ) : (
                <Bars3Icon className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700 animate-slideDown">
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-semibold py-2 px-4 rounded-lg transition-all ${
                    isActive('/')
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  Reservar Cancha
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-semibold py-2 px-4 rounded-lg transition-all ${
                    isActive('/shop')
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  Tienda
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg hover:shadow-lg text-center"
                >
                  Admin
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-secondary/50 border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">Padel Club</h3>
              <p className="text-text-secondary text-sm">
                El mejor lugar para jugar pádel. Canchas de primera calidad,
                horarios flexibles y un ambiente increíble.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-text-secondary hover:text-primary transition-colors text-sm">
                    Reservar Cancha
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="text-text-secondary hover:text-primary transition-colors text-sm">
                    Tienda
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-text-secondary hover:text-primary transition-colors text-sm">
                    Panel de Admin
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>📍 La Rioja, Argentina</li>
                <li>📞 +54 9 XXX XXX-XXXX</li>
                <li>✉️ info@padelclub.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-text-secondary text-sm">
              &copy; 2024 Padel Club Manager. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PublicLayout;