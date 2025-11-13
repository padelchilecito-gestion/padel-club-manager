import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
  ViewColumnsIcon,
  UsersIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  InboxStackIcon,
  ArrowPathIcon,
  XMarkIcon, // <-- Añadido
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: 'dashboard', text: 'Dashboard', icon: ChartBarIcon, role: ['Admin', 'Operator'] },
  { to: 'bookings', text: 'Turnos', icon: CalendarDaysIcon, role: ['Admin', 'Operator'] },
  { to: 'recurring-bookings', text: 'Turnos Fijos', icon: ArrowPathIcon, role: ['Admin', 'Operator'] },
  { to: 'pos', text: 'Punto de Venta', icon: BanknotesIcon, role: ['Admin', 'Operator'] },
  { to: 'cashbox', text: 'Caja', icon: InboxStackIcon, role: ['Admin', 'Operator'] },
  { to: 'inventory', text: 'Inventario', icon: ArchiveBoxIcon, role: ['Admin', 'Operator'] },
  { to: 'courts', text: 'Canchas', icon: ViewColumnsIcon, role: ['Admin', 'Operator'] },
  { type: 'divider', role: ['Admin'] },
  { to: 'users', text: 'Usuarios', icon: UsersIcon, role: ['Admin'] },
  { to: 'reports', text: 'Reportes', icon: DocumentChartBarIcon, role: ['Admin'] },
  { to: 'logs', text: 'Actividad', icon: ClipboardDocumentListIcon, role: ['Admin'] },
  { to: 'settings', text: 'Configuración', icon: Cog6ToothIcon, role: ['Admin'] },
];

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => { // <-- Recibe props
  const { isAdmin } = useAuth();

  const activeLinkStyle = {
    backgroundColor: '#FF6700', // primary
    color: 'white',
  };

  // Cierra el sidebar al hacer clic en un link en móvil
  const handleLinkClick = () => {
    if (window.innerWidth < 768) { // 768px es el breakpoint 'md' de Tailwind
      setIsSidebarOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white text-center">Padel Club</h2>
        {/* Botón de cerrar (solo en móvil) */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="text-text-secondary p-1 md:hidden"
          title="Cerrar menú"
        >
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
                  onClick={handleLinkClick} // <-- Cierra el menú al navegar
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
    </>
  );

  return (
    <>
      {/* Sidebar Móvil (Oculto por defecto, se muestra con 'isSidebarOpen') */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-dark-secondary flex-shrink-0 flex flex-col z-40
                    transform transition-transform duration-300 ease-in-out md:hidden
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop (Visible por defecto, oculto en móvil) */}
      <aside className="hidden md:flex w-64 bg-dark-secondary flex-shrink-0 flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
