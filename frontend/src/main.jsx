import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PublicSettingsProvider } from './contexts/PublicSettingsContext'
import App from './App.jsx'
import './index.css'

// --- ¡NUEVAS IMPORTACIONES! ---
import { initMercadoPago } from '@mercadopago/sdk-react'

// --- INICIALIZACIÓN DE MERCADO PAGO ---
// Asegúrate de tener VITE_MERCADOPAGO_PUBLIC_KEY en tu archivo .env del frontend
// (Usa la Public Key de PRUEBA por ahora)
const mpPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (mpPublicKey) {
  initMercadoPago(mpPublicKey);
} else {
  console.error("VITE_MERCADOPAGO_PUBLIC_KEY no está definida. El pago fallará.");
}
// -------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PublicSettingsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PublicSettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
