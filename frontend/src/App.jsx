import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ShopPage from './pages/ShopPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

const ProtectedRoute = ({ children }) => {
    // Obtenemos el rol del usuario, no solo si es admin
    const { userRole, loading } = useAuth(); 

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }
    
    // ⭐ CORRECCIÓN CLAVE:
    // En lugar de verificar `isAdmin`, ahora verificamos si existe un `userRole`.
    // Si el usuario tiene un rol ('Admin' o 'Operator'), puede pasar. Si no, va al login.
    return userRole ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <div className="bg-dark-primary min-h-screen text-text-primary font-sans">
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                    </Route>

                    {/* Rutas especiales sin el Header principal */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/pago-exitoso" element={<PaymentSuccessPage />} />
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute>
                                <AdminPage />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </div>
        </AuthProvider>
    );
}

export default App;