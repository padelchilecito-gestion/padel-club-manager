import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePublicSettings } from '../contexts/PublicSettingsContext'; // --- IMPORTADO ---

// Helper para limpiar el número de WhatsApp
const cleanPhoneNumber = (number) => {
    return number.replace(/[^0-9]/g, ''); // Deja solo números
};

const Navbar = () => {
  const { settings } = usePublicSettings(); // Obtenemos settings
  const contactNumber = settings.publicContactNumber ? cleanPhoneNumber(settings.publicContactNumber) : '';

  return (
    <nav className="bg-dark-secondary shadow-md p-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-primary">
        <NavLink to="/">Padel Club</NavLink>
      </div>
      <div className="flex items-center gap-6">
        {/* Botón de Tienda (condicional, sin cambios) */}
        {settings.shopEnabled && (
          <NavLink
            to="/shop"
            className="text-text-secondary hover:text-primary transition-colors"
          >
            Tienda
          </NavLink>
        )}
        
        {/* --- NUEVO BOTÓN DE CONTACTO WHATSAPP --- */}
        {contactNumber && (
          <a
            href={`https://wa.me/${contactNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-primary transition-colors"
          >
            Contacto
          </a>
        )}
        {/* -------------------------------------- */}

        <NavLink
          to="/login"
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Login
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
