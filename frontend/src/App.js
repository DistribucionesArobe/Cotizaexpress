import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';

import Dashboard from './pages/Dashboard';
import Cotizaciones from './pages/Cotizaciones';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Conversaciones from './pages/Conversaciones';
import CargaProductos from './pages/CargaProductos';
import LandingPage from './pages/LandingPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <BrowserRouter>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50" data-testid="main-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">CotizaBot</h1>
                  <p className="text-xs text-slate-500">Sistema Multi-Agente</p>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
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
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/conversaciones" element={<Conversaciones />} />
          </Routes>
        </main>
      </BrowserRouter>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;