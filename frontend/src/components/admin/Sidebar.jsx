import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Warehouse,
  Box,
  ClipboardList,
  Users,
  BookOpen,
  BarChart2,
  Settings,
  Building,
  LogOut
} from 'lucide-react';

const frontendVersion = import.meta.env.VITE_APP_VERSION;

const Sidebar = () => {
  const { isAdmin, logout } = useAuth();
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

  const navLinks = [
    { to: 'dashboard', text: 'Dashboard', icon: LayoutDashboard, role: ['Admin', 'Operator'] },
    { to: 'bookings', text: 'Turnos', icon: CalendarDays, role: ['Admin', 'Operator'] },
    { to: 'pos', text: 'Punto de Venta', icon: ShoppingCart, role: ['Admin', 'Operator'] },
    { to: 'cashbox', text: 'Caja', icon: Warehouse, role: ['Admin', 'Operator'] },
    { to: 'inventory', text: 'Inventario', icon: Box, role: ['Admin', 'Operator'] },
    { to: 'courts', text: 'Canchas', icon: ClipboardList, role: ['Admin', 'Operator'] },
    { type: 'divider', role: ['Admin'] },
    { to: 'users', text: 'Usuarios', icon: Users, role: ['Admin'] },
    { to: 'sales', text: 'Ventas', icon: BookOpen, role: ['Admin'] },
    { to: 'reports', text: 'Reportes', icon: BarChart2, role: ['Admin'] },
    { to: 'logs', text: 'Actividad', icon: ClipboardList, role: ['Admin'] },
    { to: 'settings', text: 'Configuración', icon: Settings, role: ['Admin'] },
  ];

  const activeLinkStyle = {
    backgroundColor: '#FF6700', // primary
    color: 'white',
  };

  return (
    <aside className="w-64 bg-dark-secondary flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-gray-700">
         <NavLink to="/admin/dashboard" className="text-2xl font-bold text-white flex items-center justify-center">
          <Building className="mr-2" /> Padel Club
        </NavLink>
      </div>
      <nav className="mt-6 flex-1 overflow-y-auto">
        <ul>
          {navLinks.map((link, index) => {
            if (link.type === 'divider') {
              return isAdmin ? <li key={index}><hr className="my-4 border-gray-700" /></li> : null;
            }
            if (!link.role.includes(isAdmin ? 'Admin' : 'Operator')) {
              return null;
            }
            return (
              <li key={link.to} className="px-4">
                <NavLink
                  to={link.to}
                  style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
                  className="flex items-center px-4 py-3 my-1 text-text-secondary hover:bg-primary-dark hover:text-white rounded-md transition-colors"
                >
                  <link.icon className="h-6 w-6 mr-3" />
                  <span>{link.text}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
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

      <div className="p-4 border-t border-gray-700">
        <div
          className={`text-xs p-2 rounded text-white ${
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
