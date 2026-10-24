import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { trackGoogleAdsConversion, trackTrialStarted } from '../lib/googleAdsConversions';
import { getAcquisition, acquisitionRegion, registrationTrialPlan } from '../lib/acquisition';

export default function Registro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registro } = useAuth();
  const [loading, setLoading] = useState(false);
  const [yaExiste, setYaExiste] = useState('');
  const referralCode = searchParams.get('ref') || '';
  const acquisition = getAcquisition();
  const esUSA = acquisitionRegion(acquisition, (searchParams.get('utm_source') || '').startsWith('usa') ? 'US' : 'MX') === 'US';
  // ¿Viene a buscar el bot de WhatsApp? Solo entonces va al wizard
  const planUrl = registrationTrialPlan();
  const quiereBot = planUrl === 'cotizabot' || planUrl === 'pro';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    empresa_nombre: '',
    telefono: '',
    promo_code: ''
  });
  useEffect(() => {
    try {
      const e = localStorage.getItem('generador_email');
      if (e && !formData.email) setFormData(f => ({ ...f, email: e }));
    } catch (err) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Corrige dominios mal escritos (gamail.com, hotmial.com...)
  const sugerenciaCorreo = (() => {
    const e = (formData.email || '').trim().toLowerCase();
    const m = e.match(/^([^@\s]+)@([^@\s]+)$/);
    if (!m) return null;
    const FIX = {
      'gamail.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com',
      'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.om': 'gmail.com',
      'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'homail.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotamil.com': 'hotmail.com',
      'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'outllok.com': 'outlook.com',
      'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'yahoo.com.mx.': 'yahoo.com.mx',
      'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com',
    };
    const d = FIX[m[2]];
    return d ? `${m[1]}@${d}` : null;
  })();
  const [promoStatus, setPromoStatus] = useState(null); // null | {valid, description} | 'checking'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'promo_code') setPromoStatus(null);
  };

  const validatePromo = async () => {
    const code = (formData.promo_code || '').trim();
    if (!code) return;
    setPromoStatus('checking');
    try {
      const API = process.env.REACT_APP_BACKEND_URL || '';
      const res = await fetch(`${API}/api/pagos/promo/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setPromoStatus(data.valid ? { valid: true, description: data.description } : { valid: false, reason: data.reason || 'Código inválido' });
    } catch {
      setPromoStatus({ valid: false, reason: 'Error validando código' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (!formData.email || !formData.password || !formData.empresa_nombre) {
      toast.error('Completa los 3 campos para crear tu cuenta');
      setLoading(false);
      return;
    }
    // Nombre de contacto = nombre del negocio si no se capturó
    if (!formData.nombre) formData.nombre = formData.empresa_nombre;

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const result = await registro({ ...formData, referral_code: referralCode, signup_source: acquisition.utm_source || (referralCode ? 'referido' : 'directo'), signup_campaign: acquisition.utm_campaign || '', plan_prueba: (['cotizabot','pro'].includes(planUrl) ? planUrl : (quiereBot ? 'cotizabot' : 'cotizador')) + (esUSA ? '_usa' : ''), whatsapp: (esUSA && formData.telefono.replace(/\D/g, '').length === 10 ? '1' : '') + formData.telefono });
    if (result?.success && window.fbq) { try { window.fbq('track', 'CompleteRegistration'); } catch (e) {} }

    if (result.success) {
      trackGoogleAdsConversion('registration');
      trackTrialStarted(result.trial);
      toast.success('¡Registro exitoso! Bienvenido a CotizaBot');
      if (esUSA) {
        try { localStorage.setItem('cotizador_region', 'US'); } catch (e) {}
      }
      // Por defecto: directo al Cotizador (primer valor en un clic). El wizard es solo para el bot.
      navigate(quiereBot ? '/onboarding' : '/cotizador');
    } else if (/ya registrado/i.test(result.error || '')) {
      setYaExiste(formData.email.trim());
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4">
      <Helmet>
        <title>Crear Cuenta - CotizaBot | Automatiza Cotizaciones por WhatsApp</title>
        <meta name="description" content="Registra tu negocio en CotizaBot y automatiza cotizaciones por WhatsApp con IA. Para ferreterías, distribuidoras, materiales y más. Desde $1,000 MXN/mes." />
        <link rel="canonical" href="https://cotizaexpress.com/registro" />
        <meta property="og:title" content="Crear Cuenta en CotizaBot" />
        <meta property="og:description" content="Automatiza cotizaciones por WhatsApp para tu negocio con IA." />
        <meta property="og:url" content="https://cotizaexpress.com/registro" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_MX" />
      </Helmet>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6" data-testid="logo-link">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">🤖</div>
            <div className="text-left">
              <span className="text-xl font-bold text-slate-900 block">CotizaBot</span>
              <span className="text-xs text-slate-400">by CotizaExpress</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{esUSA ? 'Crea tu cuenta y haz tu primer estimate' : (quiereBot ? 'Prueba tu bot de cotizaciones' : 'Crea tu cuenta y haz tu cotización')}</h1>
          <p className="text-slate-600">{esUSA ? '7 días gratis ilimitado · sin tarjeta · tu primer estimate en 2 minutos' : `🎁 7 días gratis de ${quiereBot ? 'CotizaBot' : 'Cotizador IA'} ilimitado · sin tarjeta · solo 3 datos`}</p>
          {referralCode && (
            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full border border-emerald-200">
              <span>Referido por un afiliado</span>
            </div>
          )}
        </div>

        <Card>

          <CardContent>
            {yaExiste && (
              <div className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
                <p className="font-bold text-slate-900">Ya tienes cuenta con {yaExiste} 🙌</p>
                <p className="text-sm text-slate-600 mt-1">No necesitas otra. Entra con tu correo y contraseña; tus cotizaciones siguen ahí.</p>
                <Link to={`/login?email=${encodeURIComponent(yaExiste)}&next=/cotizador`}>
                  <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 font-bold">Entrar a mi cuenta →</Button>
                </Link>
                <Link to="/recuperar-contrasena" className="block text-xs text-slate-500 underline mt-2">¿Olvidaste tu contraseña?</Link>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  1. ¿Cómo se llama tu negocio?
                </label>
                <input
                  type="text"
                  name="empresa_nombre"
                  value={formData.empresa_nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={esUSA ? "Ej: García Painting LLC" : "Ej: Ferretería López"}
                  required
                  data-testid="input-empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  2. Tu correo
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="tu@email.com"
                  required
                  data-testid="input-email"
                />
                {sugerenciaCorreo && (
                  <button type="button" onClick={() => setFormData({ ...formData, email: sugerenciaCorreo })} className="mt-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-full text-left">
                    ⚠️ ¿Quisiste decir <strong>{sugerenciaCorreo}</strong>? Toca para corregir
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  3. Inventa una contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  4. Tu WhatsApp <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^\d+ ]/g, '').slice(0, 16) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={esUSA ? 'Ej: 512 123 4567' : 'Ej: 81 1234 5678'}
                  data-testid="input-whatsapp"
                />
                <p className="text-xs text-slate-400 mt-1">Para ayudarte si te atoras. Nada de spam.</p>
              </div>

              <details className="text-sm">
                <summary className="text-emerald-700 cursor-pointer">¿Tienes un código promocional?</summary>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    name="promo_code"
                    value={formData.promo_code}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                    placeholder="Ej: PRUEBA10"
                    data-testid="input-promo"
                  />
                  <button
                    type="button"
                    onClick={validatePromo}
                    disabled={!formData.promo_code?.trim() || promoStatus === 'checking'}
                    className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {promoStatus === 'checking' ? 'Validando...' : 'Validar'}
                  </button>
                </div>
                {promoStatus && promoStatus !== 'checking' && (
                  <p className={`text-sm mt-1 ${promoStatus.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {promoStatus.valid ? `✓ ${promoStatus.description}` : `✗ ${promoStatus.reason}`}
                  </p>
                )}
              </details>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
                data-testid="btn-registro"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando cuenta...
                  </>
                ) : (
                  (esUSA || !quiereBot) ? 'Crear mi cuenta gratis →' : 'Crear mi bot gratis →'
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                Al registrarte aceptas nuestros términos de servicio
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Inicia sesión
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
