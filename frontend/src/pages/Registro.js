import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Registro() {
  const navigate = useNavigate();
  const { registro } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    empresa_nombre: '',
    telefono: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (!formData.email || !formData.password || !formData.nombre || !formData.empresa_nombre) {
      toast.error('Por favor completa todos los campos requeridos');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const result = await registro(formData);

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
        <meta name="description" content="Registrate en CotizaBot y automatiza las cotizaciones de tu ferreteria por WhatsApp con IA. Planes desde $1,000 MXN/mes." />
        <link rel="canonical" href="https://cotizaexpress.com/registro" />
        <meta property="og:title" content="Crear Cuenta en CotizaBot" />
        <meta property="og:description" content="Automatiza cotizaciones por WhatsApp para tu ferreteria o distribuidora." />
        <meta property="og:url" content="https://cotizaexpress.com/registro" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_MX" />
      </Helmet>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6" data-testid="logo-link">
            <img 
              src="/logo-cotizaexpress.png" 
              alt="CotizaBot by CotizaExpress.com" 
              className="h-12 w-auto"
            />
            <div className="text-left">
              <span className="text-xl font-bold text-slate-900 block">CotizaBot</span>
              <span className="text-xs text-slate-500">by CotizaExpress.com</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crear Cuenta</h1>
          <p className="text-slate-600">Automatiza tus cotizaciones por WhatsApp</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Juan Pérez"
                  required
                  data-testid="input-nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
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
                  Contraseña *
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
                  Nombre de tu Empresa *
                </label>
                <input
                  type="text"
                  name="empresa_nombre"
                  value={formData.empresa_nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Mi Ferretería"
                  required
                  data-testid="input-empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="5512345678"
                  data-testid="input-telefono"
                />
              </div>

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
                  'Crear Cuenta'
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