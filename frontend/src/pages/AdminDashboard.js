import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Shield, Tag, Phone, Users, Building2,
  CreditCard, TrendingUp, ArrowRight, Loader2,
  AlertTriangle, CheckCircle, Search, Package,
  MessageSquare, Calendar, Mail, MapPin, Clock,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 30) return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  if (diffDays > 0) return `hace ${diffDays}d`;
  if (diffHours > 0) return `hace ${diffHours}h`;
  if (diffMins > 0) return `hace ${diffMins}m`;
  return 'ahora';
}

function PlanBadge({ plan }) {
  const config = {
    free: { label: 'Free', cls: 'bg-slate-100 text-slate-600' },
    cotizabot: { label: 'Completo', cls: 'bg-emerald-100 text-emerald-700' },
    pro: { label: 'Pro', cls: 'bg-amber-100 text-amber-700' },
    enterprise: { label: 'Enterprise', cls: 'bg-purple-100 text-purple-700' },
  };
  const c = config[plan] || config.free;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [filter, setFilter] = useState('all'); // all, paid, free, trial
  const [searchTerm, setSearchTerm] = useState('');

  const esAdmin = user?.rol === 'admin';

  useEffect(() => {
    if (esAdmin) {
      loadAll();
    }
  }, [esAdmin]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [statsRes, companiesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/companies`),
      ]);
      setStats(statsRes.data);
      setCompanies(companiesRes.data.companies || []);
    } catch (error) {
      console.error('Error cargando admin data:', error);
      if (error.response?.status === 403) {
        toast.error('No tienes permisos de administrador');
      } else {
        toast.error('Error al cargar datos de admin');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-slate-500 text-sm">Cargando panel de administración...</p>
      </div>
    );
  }

  // Filter companies
  const filtered = companies.filter(c => {
    if (filter === 'paid' && (!c.plan_code || c.plan_code === 'free')) return false;
    if (filter === 'free' && c.plan_code && c.plan_code !== 'free') return false;
    if (filter === 'trial' && !c.trial_end) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(term) ||
        (c.owner_email || '').toLowerCase().includes(term) ||
        (c.owner_phone || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  const paidCount = companies.filter(c => c.plan_code && c.plan_code !== 'free').length;
  const trialCount = companies.filter(c => c.trial_end && new Date(c.trial_end) > new Date()).length;

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Panel de Administración</h2>
            <p className="text-slate-500 text-sm">Vista completa de CotizaExpress</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_empresas || 0}</p>
                <p className="text-xs text-slate-500">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.suscripciones_activas || 0}</p>
                <p className="text-xs text-slate-500">Pagando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.cotizaciones_totales || 0}</p>
                <p className="text-xs text-slate-500">Conversaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.promos_activos || 0}</p>
                <p className="text-xs text-slate-500">Promos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Twilio Alert */}
      {stats?.twilio_balance !== null && stats?.twilio_balance !== undefined && stats.twilio_balance < 10 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">Saldo bajo en Twilio:</span> ${stats.twilio_balance?.toFixed(2)} USD — recarga pronto.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/admin/promo-codes">
          <Card className="hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">Códigos Promo</span>
                <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/twilio">
          <Card className="hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">Twilio</span>
                {stats?.twilio_balance !== null && stats?.twilio_balance !== undefined && (
                  <Badge variant={stats.twilio_balance < 10 ? 'destructive' : 'secondary'} className="ml-auto text-xs">
                    ${stats.twilio_balance?.toFixed(2)}
                  </Badge>
                )}
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/search">
          <Card className="hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Motor Búsqueda</span>
                <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
          <Card className="hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Stripe</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* System Status */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-600">Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              {stats?.twilio_connected ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm text-slate-600">Twilio ({stats?.numeros_comprados || 0} nums)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-600">Facturama</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Empresas Registradas
            <span className="text-sm font-normal text-slate-500 ml-2">({companies.length} total)</span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 w-48"
              />
            </div>
            {/* Filters */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'paid', label: `Pagando (${paidCount})` },
                { key: 'trial', label: `Trial (${trialCount})` },
                { key: 'free', label: 'Free' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === f.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-slate-500">No se encontraron empresas</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((company) => {
              const isExpanded = expandedCompany === company.id;
              const hasWhatsApp = !!company.wa_phone_number_id;
              const hasTrial = company.trial_end && new Date(company.trial_end) > new Date();
              const trialExpired = company.trial_end && new Date(company.trial_end) <= new Date();

              return (
                <Card
                  key={company.id}
                  className={`transition-all ${isExpanded ? 'border-amber-300 shadow-md' : 'hover:border-slate-300'}`}
                >
                  <CardContent className="py-3 px-4">
                    {/* Main row */}
                    <button
                      className="w-full flex items-center gap-4 text-left"
                      onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
                    >
                      {/* Company icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        company.plan_code && company.plan_code !== 'free'
                          ? 'bg-emerald-100'
                          : 'bg-slate-100'
                      }`}>
                        <Building2 className={`w-5 h-5 ${
                          company.plan_code && company.plan_code !== 'free'
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`} />
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">{company.name || 'Sin nombre'}</p>
                          <PlanBadge plan={company.plan_code} />
                          {hasTrial && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              Trial hasta {new Date(company.trial_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {trialExpired && (
                            <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Trial vencido</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {company.owner_email || 'Sin email'}
                          {company.owner_phone ? ` · ${company.owner_phone}` : ''}
                        </p>
                      </div>

                      {/* Stats chips */}
                      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1" title="Productos">
                          <Package className="w-3.5 h-3.5" /> {company.num_products || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Conversaciones">
                          <MessageSquare className="w-3.5 h-3.5" /> {company.num_conversations || 0}
                        </span>
                        {hasWhatsApp && (
                          <span className="flex items-center gap-1 text-emerald-600" title="WhatsApp conectado">
                            <Phone className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="text-slate-400" title={company.created_at}>
                          {timeAgo(company.created_at)}
                        </span>
                      </div>

                      {/* Expand arrow */}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Contacto</p>
                            <div className="space-y-1.5">
                              <p className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700">{company.owner_email || '—'}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700">{company.telefono_atencion || company.owner_phone || '—'}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700 truncate">{company.address_text || '—'}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700">{company.hours_text || '—'}</span>
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Suscripción</p>
                            <div className="space-y-1.5">
                              <p className="text-slate-700">
                                Plan: <PlanBadge plan={company.plan_code} />
                              </p>
                              {company.stripe_customer_id && (
                                <p className="text-slate-700 text-xs">
                                  Stripe: <code className="bg-slate-100 px-1 rounded">{company.stripe_customer_id}</code>
                                </p>
                              )}
                              {company.trial_end && (
                                <p className="text-slate-700">
                                  Trial: {new Date(company.trial_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              )}
                              <p className="text-slate-700">
                                Onboarding: {company.onboarding_completed ? (
                                  <span className="text-emerald-600 font-medium">Completado</span>
                                ) : (
                                  <span className="text-amber-600 font-medium">Pendiente</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Actividad</p>
                            <div className="space-y-1.5">
                              <p className="text-slate-700">
                                <span className="font-medium">{company.num_products || 0}</span> productos cargados
                              </p>
                              <p className="text-slate-700">
                                <span className="font-medium">{company.num_conversations || 0}</span> conversaciones
                              </p>
                              <p className="text-slate-700">
                                WhatsApp: {company.wa_phone_number_id ? (
                                  <span className="text-emerald-600 font-medium">Conectado</span>
                                ) : (
                                  <span className="text-slate-400">No configurado</span>
                                )}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {company.construccion_ligera_enabled && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Construcción</span>
                                )}
                                {company.rejacero_enabled && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Rejacero</span>
                                )}
                                {company.pintura_enabled && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Pintura</span>
                                )}
                                {company.impermeabilizante_enabled && (
                                  <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Impermeab.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span>Registrada: {company.created_at ? new Date(company.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                          <span>Actualizada: {timeAgo(company.updated_at)}</span>
                          <code className="bg-slate-50 px-1.5 py-0.5 rounded text-xs">{company.id}</code>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
