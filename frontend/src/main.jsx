import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PublicSettingsProvider } from './contexts/PublicSettingsContext' // --- IMPORTADO ---
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PublicSettingsProvider> {/* --- AÑADIDO --- */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PublicSettingsProvider> {/* --- AÑADIDO --- */}
    </AuthProvider>
  </React.StrictMode>,
)
