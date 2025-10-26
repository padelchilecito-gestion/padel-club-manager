import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building, Phone, Mail, MapPin } from 'lucide-react';
import { getSettings } from '../../services/settingService'; // Importamos el servicio

const PublicLayout = () => {
  // --- AÑADIMOS ESTADO PARA CARGAR SETTINGS ---
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error loading settings in layout:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  // --- FIN DEL BLOQUE AÑADIDO ---

  return (
    <div className="flex flex-col min-h-screen bg-gray-dark text-text-primary">
      {/* Header */}
      <header className="bg-gray-medium shadow-lg">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 text-2xl font-bold text-text-primary">
              <Building size={28} className="text-indigo-light" />
              <span>{loading ? 'Cargando...' : (settings.clubName || 'Padel Club')}</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">
                Reservar
              </Link>
              <Link to="/shop" className="text-text-secondary hover:text-text-primary transition-colors">
                Tienda
              </Link>
              <Link
                to="/login"
                className="bg-indigo-dark hover:bg-indigo-light text-white px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Ingresar
              </Link>
            </div>
            <div className="md:hidden">
              {/* Mobile Menu Button can be added here */}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-medium border-t border-gray-light mt-16 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
          <div>
            <h5 className="text-xl font-semibold text-text-primary mb-4">
              {loading ? 'Cargando...' : (settings.clubName || 'Padel Club')}
            </h5>
            <p className="text-sm text-text-secondary">
              Pasión por el pádel.
            </p>
          </div>
          
          <div>
            <h5 className="text-xl font-semibold text-text-primary mb-4">Enlaces</h5>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Reservar
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Tienda
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Panel de Admin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xl font-semibold text-text-primary mb-4">Contacto</h5>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-center justify-center md:justify-start">
                <Phone size={16} className="mr-3" />
                <span>{loading ? '...' : (settings.clubPhone || 'Teléfono no disponible')}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <Mail size={16} className="mr-3" />
                <span>{loading ? '...' : (settings.clubEmail || 'Email no disponible')}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <MapPin size={16} className="mr-3" />
                <span>{loading ? '...' : (settings.clubAddress || 'Dirección no disponible')}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-text-secondary mt-10 border-t border-gray-light pt-6">
          © {new Date().getFullYear()} {settings.clubName || 'Padel Club Manager'}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
