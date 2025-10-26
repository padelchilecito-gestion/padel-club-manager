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
    <aside className="w-64 bg-dark-secondary text-text-secondary flex flex-col shadow-2xl">
      <div className="p-6 border-b border-gray-700">
        <NavLink to="/admin/dashboard" className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Building size={32} className="text-indigo-light" />
          <span>Padel Club</span>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink
          to="/admin/bookings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <CalendarDays size={20} />
          <span>Turnos</span>
        </NavLink>
        
        <NavLink
          to="/admin/pos"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <ShoppingCart size={20} />
          <span>Punto de Venta</span>
        </NavLink>

        <NavLink
          to="/admin/cashbox"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <DollarSign size={20} />
          <span>Gestión de Caja</span>
        </NavLink>
        
        <NavLink
          to="/admin/inventory"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <Warehouse size={20} />
          <span>Inventario</span>
        </NavLink>
        
        <NavLink
          to="/admin/courts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <Box size={20} />
          <span>Canchas</span>
        </NavLink>
        
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <Users size={20} />
          <span>Usuarios</span>
        </NavLink>
        
        <NavLink
          to="/admin/sales-history"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <ClipboardList size={20} />
          <span>Historial de Ventas</span>
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <BarChart2 size={20} />
          <span>Reportes</span>
        </NavLink>
        
        <NavLink
          to="/admin/logs"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <BookOpen size={20} />
          <span>Registro Actividad</span>
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive ? 'bg-indigo-dark text-white' : 'hover:bg-dark-primary'
            }`
          }
        >
          <Settings size={20} />
          <span>Configuración</span>
        </NavLink>
      </nav>
      
      <div className="p-4 mt-auto border-t border-gray-700">
        <div 
          className={`text-xs p-3 rounded-lg ${
            versionsMatch === true ? 'bg-green-dark/30 text-green-light' :
            versionsMatch === false ? 'bg-danger/30 text-danger' :
            'bg-dark-primary'
          }`}
        >
          <p className="font-bold text-text-primary mb-1">Versiones:</p>
          <p>Frontend: v{frontendVersion}</p>
          <p>Backend: v{backendVersion}</p>
          {versionsMatch === false && (
            <p className="font-bold text-yellow-light mt-2">¡Desfase detectado!</p>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 mt-4 rounded-lg transition-colors text-danger hover:bg-danger/20"
        >
          <LogOut size={20} />
          <span className="font-semibold">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
