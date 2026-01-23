import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Registro from './pages/Registro';
import Login from './pages/Login';
import Precios from './pages/Precios';
import Dashboard from './pages/Dashboard';
import Cotizaciones from './pages/Cotizaciones';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Conversaciones from './pages/Conversaciones';
import CargaProductos from './pages/CargaProductos';
import ConfiguracionWhatsApp from './pages/ConfiguracionWhatsApp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <BrowserRouter>
        {/* Header - Solo mostrar en rutas autenticadas */}
        {isAuthenticated && (
          <header className="bg-white border-b border-slate-200 sticky top-0 z-50" data-testid="main-header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link to="/dashboard" className="flex items-center gap-3" data-testid="header-logo-link">
                  <img 
                    src="/logo-cotizaexpress.png" 
                    alt="CotizaBot by CotizaExpress.com" 
                    className="h-10 w-auto"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">CotizaBot</h1>
                    <p className="text-xs text-slate-500">{user?.empresa?.nombre || user?.usuario?.empresa_nombre}</p>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    to="/dashboard"
                    data-testid="nav-dashboard"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'dashboard'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/cotizaciones"
                    data-testid="nav-cotizaciones"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'cotizaciones'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('cotizaciones')}
                  >
                    Cotizaciones
                  </Link>
                  <Link
                    to="/productos"
                    data-testid="nav-productos"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'productos'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('productos')}
                  >
                    Productos
                  </Link>
                  <Link
                    to="/carga-productos"
                    data-testid="nav-carga-productos"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'carga-productos'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('carga-productos')}
                  >
                    Carga Masiva
                  </Link>
                  <Link
                    to="/clientes"
                    data-testid="nav-clientes"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'clientes'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('clientes')}
                  >
                    Clientes
                  </Link>
                  <Link
                    to="/conversaciones"
                    data-testid="nav-conversaciones"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'conversaciones'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('conversaciones')}
                  >
                    Conversaciones
                  </Link>
                  <Link
                    to="/configuracion-whatsapp"
                    data-testid="nav-whatsapp"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('whatsapp')}
                  >
                    WhatsApp
                  </Link>

                  <button
                    onClick={logout}
                    className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    data-testid="btn-logout"
                  >
                    Salir
                  </button>
                </nav>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={isAuthenticated ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          <Routes>
            {/* Rutas p\u00fablicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/precios" element={<Precios />} />

            {/* Rutas protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones"
              element={
                <ProtectedRoute>
                  <Cotizaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <ProtectedRoute>
                  <Productos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carga-productos"
              element={
                <ProtectedRoute>
                  <CargaProductos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversaciones"
              element={
                <ProtectedRoute>
                  <Conversaciones />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>

      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;