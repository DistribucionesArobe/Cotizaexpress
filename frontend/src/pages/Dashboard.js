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
  ArrowRight, TrendingUp, ShoppingCart, Users, Clock, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    productos: 0, conversaciones: 0, perfilCompleto: false, waConectado: false, loading: true
  });
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [needsPricing, setNeedsPricing] = useState([]);

  useEffect(() => {
    cargarStats();
    cargarNeedsPricing();
    // Google Ads conversion — fires once when user reaches Dashboard
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-16644469311/C9COCMPJh8MZEL_k2YA-',
        'value': 1.0,
        'currency': 'MXN'
      });
    }
  }, []);

  const cargarStats = async () => {
    try {
      const [prodRes, convRes, settingsRes, waRes] = await Promise.allSettled([
        axios.get(`${API}/pricebook/items?limit=1`),
        axios.get(`${API}/conversations`),
        axios.get(`${API}/company/settings`),
        axios.get(`${API}/whatsapp/configuracion`),
      ]);

      const productos = prodRes.status === 'fulfilled'
        ? (prodRes.value.data.total || prodRes.value.data.items?.length || 0) : 0;
      const conversaciones = convRes.status === 'fulfilled'
        ? (convRes.value.data.conversations?.length || 0) : 0;
      const settings = settingsRes.status === 'fulfilled'
        ? settingsRes.value.data.settings : {};
      const perfilCompleto = !!(settings?.hours_text && settings?.owner_phone);
      const planCode = settings?.plan_code || 'free';
      const waConectado = waRes.status === 'fulfilled'
        ? !!(waRes.value.data.wa_phone_number_id) : false;

      setStats({ productos, conversaciones, perfilCompleto, waConectado, planCode, loading: false });
    } catch (err) {
      console.warn('Stats load error:', err);
      setStats(s => ({ ...s, loading: false }));
    }
  };

  const cargarNeedsPricing = async () => {
    try {
      const res = await axios.get(`${API}/pricebook/needs-pricing`);
      setNeedsPricing(res.data.items || []);
    } catch (err) {
      // silently ignore — feature is optional
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setLoadingPlan(planId);
      const response = await axios.post(`${API}/pagos/crear-checkout`, {
        plan: planId,
        success_url: `${window.location.origin}/pago-exitoso`,
        cancel_url: `${window.location.origin}/precios`,
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

  const handleCancelPlan = async () => {
    try {
      setCancelling(true);
      await axios.post(`${API}/pagos/cancelar`);
      toast.success('Tu suscripción ha sido cancelada');
      setShowCancelModal(false);
      cargarStats(); // Refresh to show free plan
    } catch (error) {
      console.error('Error cancelando:', error);
      toast.error(error.response?.data?.detail || 'Error al cancelar la suscripción');
    } finally {
      setCancelling(false);
    }
  };

  // Determine if WhatsApp is connected (via Meta channel, not just conversations)
  const esEmpresaActiva = stats.waConectado || stats.conversaciones > 0;

  // Setup steps
  const pasos = [
    {
      titulo: 'Carga tus productos',
      descripcion: stats.productos > 0
        ? `${stats.productos} producto${stats.productos !== 1 ? 's' : ''} en tu catálogo`
        : 'Sube tu catálogo por Excel o agrégalos uno por uno',
      completado: stats.productos > 0,
      link: '/carga-productos',
      linkTexto: stats.productos > 0 ? 'Agregar más' : 'Cargar productos',
      icon: Package,
    },
    {
      titulo: 'Completa tu perfil',
      descripcion: stats.perfilCompleto
        ? 'Datos de negocio configurados'
        : 'Agrega tu horario, teléfono y datos de contacto',
      completado: stats.perfilCompleto,
      link: '/perfil-empresa',
      linkTexto: stats.perfilCompleto ? 'Editar perfil' : 'Completar perfil',
      icon: UserCircle,
    },
    {
      titulo: 'Conecta WhatsApp',
      descripcion: esEmpresaActiva
        ? 'WhatsApp conectado y funcionando'
        : 'Conecta tu número de WhatsApp para empezar a cotizar',
      completado: esEmpresaActiva,
      link: '/configuracion-whatsapp',
      linkTexto: esEmpresaActiva ? 'Configuración' : 'Conectar WhatsApp',
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

      {/* ─── NEEDS PRICING ALERT ─── */}
      {needsPricing.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                {needsPricing.length} producto{needsPricing.length > 1 ? 's' : ''} sin precio
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Tus clientes pidieron estos productos pero no estaban en tu catálogo. Los agregamos automáticamente — solo falta que les pongas precio.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {needsPricing.slice(0, 5).map(item => (
                  <span key={item.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {item.name}
                  </span>
                ))}
                {needsPricing.length > 5 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-600">
                    +{needsPricing.length - 5} más
                  </span>
                )}
              </div>
              <Link
                to="/productos"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                Ir a Productos para poner precios <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

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
            link="/configuracion-whatsapp"
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
            <Link to="/perfil-empresa">
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
            {stats.planCode && stats.planCode !== 'free' ? 'Tu Plan' : (esEmpresaActiva ? 'Mejora tu plan' : 'Elige tu plan')}
          </h3>
          <p className="text-slate-600 mt-1">
            {stats.planCode && stats.planCode !== 'free'
              ? 'Aquí puedes ver tu plan actual o mejorar'
              : 'Elige el plan que mejor se adapte a tu negocio'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Plan Completo */}
          {(() => {
            const isCurrent = stats.planCode === 'cotizabot';
            return (
              <Card className={`relative ${isCurrent ? 'border-slate-300 bg-slate-50 opacity-80' : 'border-emerald-500 border-2 shadow-lg'}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={`${isCurrent ? 'bg-slate-500' : 'bg-emerald-500'} text-white px-3 py-1`}>
                    {isCurrent ? 'Plan Activo' : 'Popular'}
                  </Badge>
                </div>
                <CardContent className="pt-6 pb-6">
                  <h4 className={`text-lg font-bold ${isCurrent ? 'text-slate-500' : 'text-slate-900'}`}>CotizaBot</h4>
                  <p className="text-slate-500 text-sm mt-1">Para negocios en crecimiento</p>
                  <div className="mt-4 mb-1">
                    <span className={`text-3xl font-bold ${isCurrent ? 'text-slate-400' : 'text-slate-900'}`}>$1,000</span>
                    <span className="text-slate-500 text-sm"> MXN/mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Factura CFDI disponible</p>
                  <ul className="space-y-2.5 mb-6">
                    <PlanFeature incluido>Cotizaciones ilimitadas</PlanFeature>
                    <PlanFeature incluido>WhatsApp Business integrado</PlanFeature>
                    <PlanFeature incluido>QR y link propio</PlanFeature>
                    <PlanFeature incluido>Dashboard completo</PlanFeature>
                    <PlanFeature incluido>Soporte prioritario</PlanFeature>
                    <PlanFeature>Cobros automáticos</PlanFeature>
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full bg-slate-300 text-slate-500 cursor-default" disabled>
                      <Check className="w-4 h-4 mr-1" /> Ya tienes este plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleUpgrade('cotizabot')}
                      disabled={loadingPlan === 'cotizabot'}
                    >
                      {loadingPlan === 'cotizabot' ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Procesando...</>
                      ) : (
                        <>Empezar Ahora <ArrowRight className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Plan Pro */}
          {(() => {
            const isCurrent = stats.planCode === 'pro';
            return (
              <Card className={`relative ${isCurrent ? 'border-slate-300 bg-slate-50 opacity-80' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={`${isCurrent ? 'bg-slate-500' : 'bg-amber-500'} text-white px-3 py-1`}>
                    {isCurrent ? 'Plan Activo' : 'Cobra a tus clientes'}
                  </Badge>
                </div>
                <CardContent className="pt-6 pb-6">
                  <h4 className={`text-lg font-bold ${isCurrent ? 'text-slate-500' : 'text-slate-900'}`}>CotizaBot Pro</h4>
                  <p className="text-slate-500 text-sm mt-1">Cobra directo por WhatsApp</p>
                  <div className="mt-4 mb-1">
                    <span className={`text-3xl font-bold ${isCurrent ? 'text-slate-400' : 'text-slate-900'}`}>$2,000</span>
                    <span className="text-slate-500 text-sm"> MXN/mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Factura CFDI disponible</p>
                  <ul className="space-y-2.5 mb-6">
                    <PlanFeature incluido>Todo del plan CotizaBot</PlanFeature>
                    <PlanFeature incluido destacado={!isCurrent}>Link de pago Mercado Pago</PlanFeature>
                    <PlanFeature incluido destacado={!isCurrent}>Datos SPEI automáticos</PlanFeature>
                    <PlanFeature incluido destacado={!isCurrent}>Notificaciones de pago</PlanFeature>
                    <PlanFeature incluido>Configura tu CLABE</PlanFeature>
                    <PlanFeature incluido>Recibe pagos 24/7</PlanFeature>
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full bg-slate-300 text-slate-500 cursor-default" disabled>
                      <Check className="w-4 h-4 mr-1" /> Ya tienes este plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleUpgrade('pro')}
                      disabled={loadingPlan === 'pro'}
                    >
                      {loadingPlan === 'pro' ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Procesando...</>
                      ) : stats.planCode === 'cotizabot' ? (
                        <>Mejorar a CotizaBot Pro <ArrowRight className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Quiero Cobrar <CreditCard className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Precios en pesos mexicanos (MXN). Cancela cuando quieras. Factura CFDI deducible disponible 🇲🇽
        </p>

        {/* Cancel plan link — only show if user has an active paid plan */}
        {stats.planCode && stats.planCode !== 'free' && (
          <div className="text-center mt-3">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs text-slate-400 hover:text-red-500 underline transition-colors"
            >
              Cancelar mi plan
            </button>
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Cancelar tu plan?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Al cancelar, perderás acceso a las funciones de tu plan actual. Tu bot dejará de responder y tus datos se mantendrán por si decides regresar.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Mejor no
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancelPlan}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
