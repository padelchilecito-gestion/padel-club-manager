import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ShoppingCart, Warehouse,
  ClipboardList, Users, BarChart2, BookOpen, Settings,
  LogOut, Building, DollarSign, Box
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// --- 1. Leer la versión desde import.meta.env ---
const frontendVersion = import.meta.env.VITE_APP_VERSION;
import api from '../../services/api';

const Sidebar = () => {
  const { logout } = useAuth();
  
  const [backendVersion, setBackendVersion] = useState('cargando...');
  const [versionsMatch, setVersionsMatch] = useState(null);

  useEffect(() => {
    const fetchBackendVersion = async () => {
      try {
        const response = await api.get('/version');
        const beVersion = response.data.version;
        setBackendVersion(beVersion);
        setVersionsMatch(beVersion === frontendVersion);
      } catch (error) {
        console.error("Error fetching backend version:", error);
        setBackendVersion('Error');
        setVersionsMatch(false);
      }
    };

    fetchBackendVersion();
  }, []);

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col fixed h-screen shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <NavLink to="/admin/dashboard" className="text-2xl font-bold text-white flex items-center gap-2">
          <Building size={28} />
          <span>Padel Club</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink
          to="/admin/bookings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <CalendarDays size={20} />
          <span>Turnos</span>
        </NavLink>
        
        <NavLink
          to="/admin/pos"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <ShoppingCart size={20} />
          <span>Punto de Venta</span>
        </NavLink>

        <NavLink
          to="/admin/cashbox"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <DollarSign size={20} />
          <span>Gestión de Caja</span>
        </NavLink>
        
        <NavLink
          to="/admin/inventory"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <Warehouse size={20} />
          <span>Inventario</span>
        </NavLink>
        
        <NavLink
          to="/admin/courts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <Box size={20} /> {/* Ícono para canchas */}
          <span>Canchas</span>
        </NavLink>
        
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <Users size={20} />
          <span>Usuarios</span>
        </NavLink>
        
        <NavLink
          to="/admin/sales-history"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <ClipboardList size={20} />
          <span>Historial de Ventas</span>
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <BarChart2 size={20} />
          <span>Reportes</span>
        </NavLink>
        
        <NavLink
          to="/admin/logs"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <BookOpen size={20} />
          <span>Registro Actividad</span>
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800'
            }`
          }
        >
          <Settings size={20} />
          <span>Configuración</span>
        </NavLink>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg transition-colors text-red-400 hover:bg-red-900/50"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* --- Bloque de Versión (ahora funcionará) --- */}
      <div className="mt-auto p-4 border-t border-gray-700">
        <div 
          className={`text-xs p-2 rounded ${
            versionsMatch === true ? 'bg-green-800' :
            versionsMatch === false ? 'bg-red-800' :
            'bg-gray-700'
          }`}
        >
          <p className="font-bold">Versiones:</p>
          <p>Frontend: v{frontendVersion}</p>
          <p>Backend: v{backendVersion}</p>
          {versionsMatch === false && (
            <p className="font-bold text-yellow-300 mt-1">¡Desfase detectado!</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
