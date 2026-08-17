import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail, KeyRound, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com';
const API = `${BACKEND_URL}/api`;

// ── Paso 1: pedir el correo ─────────────────────────────────────────
export function RecuperarContrasena() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      toast.error('No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Revisa tu correo</h1>
                <p className="text-slate-600 text-sm">
                  Si <strong>{email}</strong> está registrado, te enviamos un enlace para
                  crear una contraseña nueva. El enlace es válido por 1 hora.
                </p>
                <p className="text-xs text-slate-400">
                  ¿No llega? Revisa la carpeta de spam o correo no deseado.
                </p>
                <Link to="/login" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium block">
                  ← Volver a iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
                  <p className="text-slate-600 text-sm mt-1">
                    Escribe el correo con el que entras a CotizaExpress y te mandamos un enlace para crear una nueva.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="tu@correo.com"
                    required
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                  </Button>
                </form>
                <p className="text-center mt-4">
                  <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">
                    ← Volver a iniciar sesión
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Paso 2: crear la contraseña nueva (llega con ?token=) ───────────
export function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, password });
      toast.success('¡Contraseña actualizada! Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'El enlace es inválido o expiró. Solicita uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Crea tu contraseña nueva</h1>
              <p className="text-slate-600 text-sm mt-1">Mínimo 8 caracteres.</p>
            </div>
            {!token ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-slate-600">Este enlace no es válido.</p>
                <Link to="/recuperar-contrasena" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  Solicitar un enlace nuevo
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Contraseña nueva"
                  required
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Repite la contraseña"
                  required
                />
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RecuperarContrasena;
