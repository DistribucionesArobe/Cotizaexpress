import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('¡Bienvenido de nuevo!');
      // Check if onboarding is completed to decide redirect
      try {
        const meRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com'}/api/auth/me`, { withCredentials: true });
        const onboardingDone = meRes.data?.user?.onboarding_completed;
        navigate(onboardingDone ? '/dashboard' : '/onboarding');
      } catch {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Iniciar Sesión</h1>
          <p className="text-slate-600">Accede a tu cuenta de CotizaBot</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Credenciales</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
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
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Tu contraseña"
                  required
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
                data-testid="btn-login"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-slate-600">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Regístrate gratis
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