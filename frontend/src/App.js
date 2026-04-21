import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Registro from './pages/Registro';
import Login from './pages/Login';
import Precios from './pages/Precios';
import PagoExitoso from './pages/PagoExitoso';
import Dashboard from './pages/Dashboard';
import Cotizaciones from './pages/Cotizaciones';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Conversaciones from './pages/Conversaciones';
import CargaProductos from './pages/CargaProductos';
import ConfiguracionWhatsApp from './pages/ConfiguracionWhatsApp';
import ConfigCobros from './pages/ConfigCobros';
import PerfilEmpresa from './pages/PerfilEmpresa';
import PortalCliente from './pages/PortalCliente';
import AdminPromoCodes from './pages/AdminPromoCodes';
import AdminDashboard from './pages/AdminDashboard';
import AdminTwilio from './pages/AdminTwilio';
import AdminSearchStats from './pages/AdminSearchStats';
import Onboarding from './pages/Onboarding';
// Páginas SEO
import DemoPage from './pages/DemoPage';
import FerreteriasSEO from './pages/FerreteriasSEO';
import RefaccionariasSEO from './pages/RefaccionariasSEO';
import ServiciosTecnicosSEO from './pages/ServiciosTecnicosSEO';
import PrivacidadPage from './pages/PrivacidadPage';
import TerminosPage from './pages/TerminosPage';
import Calculadoras from './pages/Calculadoras';
import { Menu, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppRoutes() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const isOnboarding = location.pathname.startsWith('/onboarding');

  return (
    <>
        {/* Header - Solo mostrar en rutas autenticadas (no en onboarding) */}
        {isAuthenticated && !isOnboarding && (
          <header className="bg-white border-b border-slate-200 sticky top-0 z-50" data-testid="main-header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
                  data-testid="header-logo-link"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <img 
                    src="/logo-cotizabot.png" 
                    alt="CotizaBot by CotizaExpress.com" 
                    className="h-10 w-auto pointer-events-none"
                  />
                  <div className="pointer-events-none">
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
                    Carga de Productos
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
                  <Link
                    to="/config-cobros"
                    data-testid="nav-cobros"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'cobros'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('cobros')}
                  >
                    💰 Cobros
                  </Link>
                  <Link
                    to="/perfil-empresa"
                    data-testid="nav-perfil"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'perfil'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setActiveTab('perfil')}
                  >
                    Mi Empresa
                  </Link>

                  {/* Enlace de Admin - Solo visible para admins */}
                  {user?.usuario?.rol === 'admin' && (
                    <Link
                      to="/admin"
                      data-testid="nav-admin"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'admin'
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-amber-600 hover:bg-amber-50'
                      }`}
                      onClick={() => setActiveTab('admin')}
                    >
                      🔐 Admin
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    data-testid="btn-logout"
                  >
                    Salir
                  </button>
                </nav>

                {/* Botón menú móvil */}
                <button
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="btn-mobile-menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>

              {/* Menú móvil desplegable */}
              {mobileMenuOpen && (
                <nav className="md:hidden py-4 border-t border-slate-200 space-y-1" data-testid="mobile-nav">
                  <Link
                    to="/dashboard"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                    }`}
                    onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    to="/cotizaciones"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      activeTab === 'cotizaciones' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                    }`}
                    onClick={() => { setActiveTab('cotizaciones'); setMobileMenuOpen(false); }}
                  >
                    📄 Cotizaciones
                  </Link>
                  <Link
                    to="/productos"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      activeTab === 'productos' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                    }`}
                    onClick={() => { setActiveTab('productos'); setMobileMenuOpen(false); }}
                  >
                    📦 Productos
                  </Link>
                  <Link
                    to="/configuracion-whatsapp"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      activeTab === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                    }`}
                    onClick={() => { setActiveTab('whatsapp'); setMobileMenuOpen(false); }}
                  >
                    💬 WhatsApp
                  </Link>
                  <Link
                    to="/config-cobros"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      activeTab === 'cobros' ? 'bg-amber-50 text-amber-700' : 'text-slate-600'
                    }`}
                    onClick={() => { setActiveTab('cobros'); setMobileMenuOpen(false); }}
                  >
                    💰 Cobros
                  </Link>
                  <Link
                    to="/perfil-empresa"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      activeTab === 'perfil' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                    }`}
                    onClick={() => { setActiveTab('perfil'); setMobileMenuOpen(false); }}
                  >
                    🏢 Mi Empresa
                  </Link>
                  
                  {user?.usuario?.rol === 'admin' && (
                    <Link
                      to="/admin"
                      className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                        activeTab === 'admin' ? 'bg-amber-50 text-amber-700' : 'text-amber-600'
                      }`}
                      onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                    >
                      🔐 Admin
                    </Link>
                  )}
                  
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600"
                  >
                    🚪 Salir
                  </button>
                </nav>
              )}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={isAuthenticated && !isOnboarding ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          <Routes>
            {/* Rutas p\u00fablicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/precios" element={<Precios />} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
            <Route path="/portal/cotizacion/:token" element={<PortalCliente />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            {/* Rutas SEO */}
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/ferreterias" element={<FerreteriasSEO />} />
            <Route path="/refaccionarias" element={<RefaccionariasSEO />} />
            <Route path="/servicios-tecnicos" element={<ServiciosTecnicosSEO />} />
            <Route path="/privacidad" element={<PrivacidadPage />} />
            <Route path="/terminos" element={<TerminosPage />} />
            <Route path="/calculadoras" element={<Calculadoras />} />

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
            <Route
              path="/configuracion-whatsapp"
              element={
                <ProtectedRoute>
                  <ConfiguracionWhatsApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/config-cobros"
              element={
                <ProtectedRoute>
                  <ConfigCobros />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil-empresa"
              element={
                <ProtectedRoute>
                  <PerfilEmpresa />
                </ProtectedRoute>
              }
            />
            
            {/* Rutas de Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promo-codes"
              element={
                <ProtectedRoute>
                  <AdminPromoCodes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/twilio"
              element={
                <ProtectedRoute>
                  <AdminTwilio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/search"
              element={
                <ProtectedRoute>
                  <AdminSearchStats />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;