import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Check, X, Package, UserCircle, MessageSquare, CreditCard,
  ArrowRight, TrendingUp, ShoppingCart, Users, Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    productos: 0, conversaciones: 0, perfilCompleto: false, loading: true
  });
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    try {
      const [prodRes, convRes, settingsRes] = await Promise.allSettled([
        axios.get(`${API}/pricebook/items?limit=1`),
        axios.get(`${API}/conversations`),
        axios.get(`${API}/company/settings`),
      ]);

      const productos = prodRes.status === 'fulfilled'
        ? (prodRes.value.data.total || prodRes.value.data.items?.length || 0) : 0;
      const conversaciones = convRes.status === 'fulfilled'
        ? (convRes.value.data.conversations?.length || 0) : 0;
      const settings = settingsRes.status === 'fulfilled'
        ? settingsRes.value.data.settings : {};
      const perfilCompleto = !!(settings?.hours_text && settings?.owner_phone);

      setStats({ productos, conversaciones, perfilCompleto, loading: false });
    } catch (err) {
      console.warn('Stats load error:', err);
      setStats(s => ({ ...s, loading: false }));
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setLoadingPlan(planId);
      const response = await axios.post(`${API}/pagos/crear-checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      });
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creando checkout:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setLoadingPlan(null);
    }
  };

  // Determine if this is an active company (has conversations = WhatsApp connected)
  const esEmpresaActiva = stats.conversaciones > 0;

  // Setup steps
  const pasos = [
    {
      titulo: 'Carga tus productos',
      descripcion: stats.productos > 0
        ? `${stats.productos} producto${stats.productos !== 1 ? 's' : ''} en tu catálogo`
        : 'Sube tu catálogo por Excel o agrégalos uno por uno',
      completado: stats.productos > 0,
      link: '/carga-masiva',
      linkTexto: stats.productos > 0 ? 'Agregar más' : 'Cargar productos',
      icon: Package,
    },
    {
      titulo: 'Completa tu perfil',
      descripcion: stats.perfilCompleto
        ? 'Datos de negocio configurados'
        : 'Agrega tu horario, teléfono y datos de contacto',
      completado: stats.perfilCompleto,
      link: '/mi-empresa',
      linkTexto: stats.perfilCompleto ? 'Editar perfil' : 'Completar perfil',
      icon: UserCircle,
    },
    {
      titulo: 'Conecta WhatsApp',
      descripcion: esEmpresaActiva
        ? 'WhatsApp conectado y funcionando'
        : 'Nuestro equipo conectará tu número. Te contactaremos por correo.',
      completado: esEmpresaActiva,
      link: '/whatsapp',
      linkTexto: esEmpresaActiva ? 'Configuración' : 'Ver estado',
      icon: MessageSquare,
    },
  ];

  const pasosCompletados = pasos.filter(p => p.completado).length;
  const todoCompleto = pasosCompletados === pasos.length;

  if (stats.loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          {esEmpresaActiva
            ? `¡Hola${user?.empresa_nombre && user.empresa_nombre !== user.email ? `, ${user.empresa_nombre}` : ''}!`
            : `¡Bienvenido${user?.empresa_nombre && user.empresa_nombre !== user.email ? `, ${user.empresa_nombre}` : ''}!`
          }
        </h2>
        <p className="text-slate-600 mt-1">
          {esEmpresaActiva
            ? 'Aquí tienes el resumen de tu CotizaBot'
            : 'Configura tu CotizaBot y empieza a recibir cotizaciones automáticas'
          }
        </p>
      </div>

      {/* ─── ACTIVE COMPANY: Metrics cards ─── */}
      {esEmpresaActiva && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={MessageSquare}
            label="Conversaciones"
            value={stats.conversaciones}
            color="emerald"
            link="/conversaciones"
          />
          <MetricCard
            icon={Package}
            label="Productos"
            value={stats.productos}
            color="blue"
            link="/productos"
          />
          <MetricCard
            icon={Users}
            label="Clientes"
            value={stats.conversaciones}
            subtitle="únicos"
            color="violet"
            link="/clientes"
          />
          <MetricCard
            icon={TrendingUp}
            label="Estado del bot"
            value="Activo"
            isText
            color="emerald"
            link="/whatsapp"
          />
        </div>
      )}

      {/* ─── SETUP CHECKLIST (show if not all steps done) ─── */}
      {!todoCompleto && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {esEmpresaActiva ? 'Pendientes' : 'Pasos para activar tu bot'}
            </h3>
            <span className="text-sm text-slate-500">{pasosCompletados} de {pasos.length} completados</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-5">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(pasosCompletados / pasos.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pasos.map((paso, idx) => {
              const Icon = paso.icon;
              return (
                <Card key={idx} className={`transition-all ${paso.completado ? 'border-emerald-200 bg-emerald-50/50' : 'hover:shadow-md'}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        paso.completado ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {paso.completado ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${paso.completado ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {paso.titulo}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{paso.descripcion}</p>
                        <Link to={paso.link} className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-2">
                          {paso.linkTexto} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── QUICK ACTIONS (active companies) ─── */}
      {esEmpresaActiva && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Acciones rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/conversaciones">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">Ver conversaciones</p>
                    <p className="text-xs text-slate-500">{stats.conversaciones} chats activos</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/productos">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">Administrar productos</p>
                    <p className="text-xs text-slate-500">{stats.productos} en catálogo</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/mi-empresa">
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">Mi empresa</p>
                    <p className="text-xs text-slate-500">Perfil y configuración</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* ─── PRICING PLANS ─── */}
      <div>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">
            {esEmpresaActiva ? 'Mejora tu plan' : 'Elige tu plan'}
          </h3>
          <p className="text-slate-600 mt-1">Elige el plan que mejor se adapte a tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Plan Completo */}
          <Card className="relative border-emerald-500 border-2 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-emerald-500 text-white px-3 py-1">Popular</Badge>
            </div>
            <CardContent className="pt-6 pb-6">
              <h4 className="text-lg font-bold text-slate-900">Completo</h4>
              <p className="text-slate-500 text-sm mt-1">Para negocios en crecimiento</p>
              <div className="mt-4 mb-1">
                <span className="text-3xl font-bold text-slate-900">$1,000</span>
                <span className="text-slate-500 text-sm"> /mes + IVA</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">$1,160 MXN con IVA</p>
              <ul className="space-y-2.5 mb-6">
                <PlanFeature incluido>Cotizaciones ilimitadas</PlanFeature>
                <PlanFeature incluido>WhatsApp Business integrado</PlanFeature>
                <PlanFeature incluido>QR y link propio</PlanFeature>
                <PlanFeature incluido>Dashboard completo</PlanFeature>
                <PlanFeature incluido>Soporte prioritario</PlanFeature>
                <PlanFeature>Cobros automáticos</PlanFeature>
              </ul>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleUpgrade('completo')}
                disabled={loadingPlan === 'completo'}
              >
                {loadingPlan === 'completo' ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Procesando...</>
                ) : (
                  <>Empezar Ahora <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Plan Pro */}
          <Card className="relative bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-500 text-white px-3 py-1">Cobra a tus clientes</Badge>
            </div>
            <CardContent className="pt-6 pb-6">
              <h4 className="text-lg font-bold text-slate-900">Pro</h4>
              <p className="text-slate-500 text-sm mt-1">Cobra directo por WhatsApp</p>
              <div className="mt-4 mb-1">
                <span className="text-3xl font-bold text-slate-900">$2,000</span>
                <span className="text-slate-500 text-sm"> /mes + IVA</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">$2,320 MXN con IVA</p>
              <ul className="space-y-2.5 mb-6">
                <PlanFeature incluido>Todo del Plan Completo</PlanFeature>
                <PlanFeature incluido destacado>Link de pago Mercado Pago</PlanFeature>
                <PlanFeature incluido destacado>Datos SPEI automáticos</PlanFeature>
                <PlanFeature incluido destacado>Notificaciones de pago</PlanFeature>
                <PlanFeature incluido>Configura tu CLABE</PlanFeature>
                <PlanFeature incluido>Recibe pagos 24/7</PlanFeature>
              </ul>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => handleUpgrade('pro')}
                disabled={loadingPlan === 'pro'}
              >
                {loadingPlan === 'pro' ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Procesando...</>
                ) : (
                  <>Quiero Cobrar <CreditCard className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Todos los precios son en pesos mexicanos (MXN). Cancela cuando quieras.
        </p>
      </div>
    </div>
  );
}

/* ─── Metric Card component ─── */
function MetricCard({ icon: Icon, label, value, subtitle, color, link, isText }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', accent: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-100',    text: 'text-blue-600',    accent: 'text-blue-700' },
    violet:  { bg: 'bg-violet-100',  text: 'text-violet-600',  accent: 'text-violet-700' },
    amber:   { bg: 'bg-amber-100',   text: 'text-amber-600',   accent: 'text-amber-700' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <Link to={link}>
      <Card className="hover:shadow-md transition-all cursor-pointer">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${isText ? c.accent : 'text-slate-900'}`}>
            {isText ? value : value.toLocaleString('es-MX')}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {label}{subtitle ? ` ${subtitle}` : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ─── Plan Feature line ─── */
function PlanFeature({ children, incluido, destacado }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {incluido ? (
        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${destacado ? 'text-amber-500' : 'text-emerald-500'}`} />
      ) : (
        <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300" />
      )}
      <span className={`${incluido ? (destacado ? 'text-amber-700 font-medium' : 'text-slate-700') : 'text-slate-400'}`}>
        {children}
      </span>
    </li>
  );
}
