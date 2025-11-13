import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // --- LÓGICA PARA EL BOTÓN DE INSTALAR PWA ---
    const handleBeforeInstallPrompt = (e) => {
      // Previene que el navegador muestre su propio "prompt" de instalación
      e.preventDefault();
      // Guarda el evento para poder dispararlo después con un botón
      setDeferredPrompt(e);
      // Muestra el botón de instalación si el evento está disponible
      setShowInstallButton(true);
      console.log('beforeinstallprompt event fired and captured.');
    };

    // Añade el event listener para 'beforeinstallprompt'
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Limpia el event listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
    // -------------------------------------------
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Oculta el botón
      setShowInstallButton(false);
      // Muestra el prompt de instalación del navegador
      deferredPrompt.prompt();
      // Espera la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // Resetea el deferredPrompt, ya que solo se puede usar una vez
      setDeferredPrompt(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-primary mb-6 animate-fade-in-down">
          Padel Club Manager
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary mb-10 animate-fade-in-up">
          Gestiona tus canchas y reservas con facilidad.
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-lg">¡Bienvenido de nuevo, {user.name}!</p>
            <Link
              to="/admin/dashboard"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 duration-300 shadow-lg"
            >
              Ir al Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <Link
              to="/login"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 duration-300 shadow-lg"
            >
              Iniciar Sesión
            </Link>
            <p className="text-text-secondary mt-4">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-secondary hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        )}

        {/* --- BOTÓN DE INSTALACIÓN PWA (Visible solo si el navegador lo permite) --- */}
        {showInstallButton && (
          <button
            onClick={handleInstallClick}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105 duration-300 shadow-lg flex items-center justify-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H9V8h4v8zm-2-6V6h2v4h-2z"/>
            </svg>
            Instalar App
          </button>
        )}
        {/* ------------------------------------------------------------------------- */}

      </div>
    </div>
  );
};

export default HomePage;
