import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const PublicLayout = () => {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet /> {/* Aquí se renderizará el contenido de cada página */}
      </main>
    </div>
  );
};

export default PublicLayout;