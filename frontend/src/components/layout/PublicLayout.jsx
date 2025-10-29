// frontend/src/components/layout/PublicLayout.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import settingService from '../../services/settingService'; // Para verificar si la tienda está habilitada
const PublicLayout = () => {
    const { user, logout } = useAuth(); // Usamos 'user' en lugar de 'isAdmin' para saber si alguien está logueado
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [shopEnabled, setShopEnabled] = useState(false); // Estado para la tienda

    // Cargar configuración para saber si mostrar la tienda
    useEffect(() => {
        const fetchShopStatus = async () => {
            try {
                const settings = await settingService.getSettings();
                setShopEnabled(settings.SHOP_ENABLED === 'true');
            } catch (error) {
                console.error("Error al cargar la configuración de la tienda:", error);
            }
        };
        fetchShopStatus();
    }, []);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // Clases comunes para NavLink
    const navLinkClasses = ({ isActive }) =>
      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-purple-600 text-white' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`;
    
    // Clases para NavLink en móvil
    const mobileNavLinkClasses = ({ isActive }) =>
      `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive 
          ? 'bg-purple-600 text-white' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo o Título */}
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-white text-xl font-bold">
                                Padel Club Manager
                            </Link>
                        </div>

                        {/* Menú Desktop */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <NavLink to="/" className={navLinkClasses}>Inicio</NavLink>
                                
                                {/* Mostrar Tienda si está habilitada Y el usuario NO está logueado */}
                                {shopEnabled && !user && (
                                     <NavLink to="/shop" className={navLinkClasses}>Tienda</NavLink>
                                )}
                                
                                {/* Opciones condicionales: Admin/Logout si está logueado, Login si no */}
                                {user ? (
                                    <>
                                        {/* Podrías añadir un enlace a 'Mis Reservas' aquí si existe */}
                                        {/* <NavLink to="/my-bookings" className={navLinkClasses}>Mis Reservas</NavLink> */}
                                        
                                        {/* Enlace a Admin si es Admin u Operator */}
                                        {(user.role === 'Admin' || user.role === 'Operator') && (
                                            <NavLink to="/admin" className={navLinkClasses}>Admin</NavLink>
                                        )}
                                        <button 
                                            onClick={logout} 
                                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Login siempre visible si no está logueado */}
                                        <NavLink to="/login" className={navLinkClasses}>Login</NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Botón Menú Móvil */}
                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={toggleMobileMenu}
                                type="button"
                                className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Abrir menú principal</span>
                                {!isMobileMenuOpen ? (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                ) : (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menú Móvil */}
                <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink to="/" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Inicio</NavLink>
                        
                        {/* Mostrar Tienda si está habilitada Y el usuario NO está logueado */}
                        {shopEnabled && !user && (
                             <NavLink to="/shop" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Tienda</NavLink>
                        )}
                        
                        {/* Opciones condicionales móvil */}
                        {user ? (
                           <>
                               {/* <NavLink to="/my-bookings" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Mis Reservas</NavLink> */}
                               {(user.role === 'Admin' || user.role === 'Operator') && (
                                   <NavLink to="/admin" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Admin</NavLink>
                               )}
                               <button 
                                   onClick={() => { logout(); closeMobileMenu(); }} 
                                   className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                               >
                                   Logout
                               </button>
                           </>
                        ) : (
                            <>
                               <NavLink to="/login" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Login</NavLink>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Contenido Principal */}
            <main>
                <Outlet /> {/* Aquí se renderizan las páginas hijas (HomePage, LoginPage, etc.) */}
            </main>

            {/* Footer (Opcional) */}
            {/* <footer className="bg-gray-800 mt-auto py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
                    © {new Date().getFullYear()} Padel Club Manager. Todos los derechos reservados.
                </div>
            </footer> */}
        </div>
    );
};

export default PublicLayout;
