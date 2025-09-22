import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importar el hook de autenticación

const Header = () => {
    const { isAdmin } = useAuth(); // Obtener el estado de autenticación
    const linkStyle = "px-4 py-2 rounded-md transition-colors hover:bg-primary hover:text-white";
    const activeLinkStyle = "bg-primary text-white";

    return (
        <header className="bg-dark-secondary shadow-md sticky top-0 z-50">
            <nav className="container mx-auto flex justify-between items-center p-4">
                <NavLink to="/" className="text-2xl font-bold font-title text-primary tracking-wider">
                    Padel Club
                </NavLink>
                <div className="flex items-center gap-4 font-bold">
                    <NavLink 
                        to="/" 
                        className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                    >
                        Reservas
                    </NavLink>
                    <NavLink 
                        to="/shop" 
                        className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                    >
                        Tienda
                    </NavLink>
                    {/* Mostrar el botón de Admin solo si está logueado */}
                    {isAdmin ? (
                         <NavLink 
                            to="/admin" 
                            className="bg-secondary text-dark-primary px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                        >
                            Panel Admin
                        </NavLink>
                    ) : (
                        <NavLink 
                            to="/login" 
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                        >
                            Login
                        </NavLink>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;