
import React from 'react';
import { Menu, X } from 'lucide-react';

const AdminHeader = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <header className="bg-dark-secondary shadow-md p-4 flex justify-between items-center md:hidden">
      <button onClick={onToggleSidebar} className="text-text-primary">
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
    </header>
  );
};

export default AdminHeader;
