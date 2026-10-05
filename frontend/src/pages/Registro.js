import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Registro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registro } = useAuth();
  const [loading, setLoading] = useState(false);
  const referralCode = searchParams.get('ref') || '';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    empresa_nombre: '',
    telefono: '',
    promo_code: ''
  });
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
      toast.error('Completa los 3 campos para crear tu bot');
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

    const result = await registro({ ...formData, referral_code: referralCode });

    if (result.success) {
      toast.success('¡Registro exitoso! Bienvenido a CotizaBot');
      navigate('/onboarding');
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crea tu bot en 2 minutos</h1>
          <p className="text-slate-600">Gratis · sin tarjeta · solo 3 datos</p>
          {referralCode && (
            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full border border-emerald-200">
              <span>Referido por un afiliado</span>
            </div>
          )}
        </div>

        <Card>

          <CardContent>
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
                  placeholder="Ej: Ferretería López"
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
                  'Crear mi bot gratis →'
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