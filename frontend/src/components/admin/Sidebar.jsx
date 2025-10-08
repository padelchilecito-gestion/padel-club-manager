import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon, CalendarDaysIcon, BanknotesIcon, ArchiveBoxIcon,
  ViewColumnsIcon, UsersIcon, DocumentChartBarIcon, ClipboardDocumentListIcon,
  Cog6ToothIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: 'dashboard', text: 'Dashboard', icon: ChartBarIcon, role: ['Admin', 'Operator'] },
  { to: 'bookings', text: 'Turnos', icon: CalendarDaysIcon, role: ['Admin', 'Operator'] },
  { to: 'pos', text: 'Punto de Venta', icon: BanknotesIcon, role: ['Admin', 'Operator'] },
  { to: 'inventory', text: 'Inventario', icon: ArchiveBoxIcon, role: ['Admin', 'Operator'] },
  { to: 'courts', text: 'Canchas', icon: ViewColumnsIcon, role: ['Admin', 'Operator'] },
  { type: 'divider', role: ['Admin'] },
  { to: 'users', text: 'Usuarios', icon: UsersIcon, role: ['Admin'] },
  { to: 'reports', text: 'Reportes', icon: DocumentChartBarIcon, role: ['Admin'] },
  { to: 'logs', text: 'Log de Actividad', icon: ClipboardDocumentListIcon, role: ['Admin'] },
  { to: 'settings', text: 'Configuración', icon: Cog6ToothIcon, role: ['Admin'] },
];

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const { isAdmin } = useAuth();

  const activeLinkStyle = {
    backgroundColor: '#FF6700',
    color: 'white',
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-dark-secondary flex-shrink-0 flex flex-col z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white text-center">Padel Club</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6 flex-1">
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
                    onClick={handleLinkClick}
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
      </aside>
    </>
  );
};

export default Sidebar;