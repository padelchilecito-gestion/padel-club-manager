import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <>
      <Header />
      <main>
        <Outlet /> {/* Aquí se renderizarán las páginas anidadas */}
      </main>
    </>
  );
};

export default Layout;