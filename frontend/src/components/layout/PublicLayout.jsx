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
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
              <Building size={24} className="text-indigo-400" />
              {/* Usamos el nombre del club desde settings */}
              <span>{loading ? 'Cargando...' : (settings.clubName || 'Padel Club')}</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Reservar
              </Link>
              <Link to="/shop" className="text-gray-300 hover:text-white transition-colors">
                Tienda
              </Link>
              <Link
                to="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Ingresar
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Columna 1: Info Club */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3">
              {loading ? 'Cargando...' : (settings.clubName || 'Padel Club')}
            </h5>
            <p className="text-sm text-gray-400">
              Pasión por el pádel.
            </p>
          </div>
          
          {/* Columna 2: Enlaces */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3">Enlaces</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Reservar
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Tienda
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Panel de Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto (AHORA DINÁMICO) */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3">Contacto</h5>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center justify-center md:justify-start">
                <Phone size={16} className="mr-2" />
                <span>{loading ? '...' : (settings.clubPhone || 'Teléfono no disponible')}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <Mail size={16} className="mr-2" />
                <span>{loading ? '...' : (settings.clubEmail || 'Email no disponible')}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <MapPin size={16} className="mr-2" />
                <span>{loading ? '...' : (settings.clubAddress || 'Dirección no disponible')}</span>
              </li>
            </ul>
          </div>

        </div>
        <div className="text-center text-xs text-gray-500 mt-8 border-t border-gray-700 pt-4">
          © {new Date().getFullYear()} {settings.clubName || 'Padel Club Manager'}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
