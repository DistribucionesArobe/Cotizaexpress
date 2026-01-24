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
  AlertTriangle, CheckCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const esAdmin = user?.usuario?.rol === 'admin';

  useEffect(() => {
    if (esAdmin) {
      cargarStats();
    }
  }, [esAdmin]);

  const cargarStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando stats:', error);
      if (error.response?.status === 403) {
        toast.error('No tienes permisos de administrador');
      } else {
        toast.error('Error al cargar estadísticas');
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
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Panel de Administración</h2>
          <p className="text-slate-600">Gestiona CotizaBot desde aquí</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.total_empresas || 0}</p>
                <p className="text-sm text-slate-500">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.suscripciones_activas || 0}</p>
                <p className="text-sm text-slate-500">Suscripciones activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.cotizaciones_totales || 0}</p>
                <p className="text-sm text-slate-500">Cotizaciones totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats?.promos_activos || 0}</p>
                <p className="text-sm text-slate-500">Códigos activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Twilio si hay bajo saldo */}
      {stats?.twilio_balance !== undefined && stats.twilio_balance < 10 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">⚠️ Saldo bajo en Twilio</p>
                <p className="text-sm text-red-700">
                  Saldo actual: ${stats.twilio_balance?.toFixed(2)} USD. Recarga pronto para evitar interrupciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-slate-900 mt-8">Herramientas de Administración</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Códigos Promocionales */}
        <Link to="/admin/promo-codes" data-testid="link-admin-promos">
          <Card className="hover:border-amber-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Códigos Promocionales</h4>
                  <p className="text-sm text-slate-500 mb-3">
                    Crea y gestiona descuentos para tus clientes
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats?.promos_activos || 0} activos</Badge>
                    <Badge variant="outline">{stats?.promos_total || 0} total</Badge>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Dashboard Twilio */}
        <Link to="/admin/twilio" data-testid="link-admin-twilio">
          <Card className="hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Twilio & WhatsApp</h4>
                  <p className="text-sm text-slate-500 mb-3">
                    Saldo, números comprados y configuración
                  </p>
                  <div className="flex items-center gap-2">
                    {stats?.twilio_balance !== undefined ? (
                      <Badge 
                        variant={stats.twilio_balance < 10 ? 'destructive' : 'secondary'}
                      >
                        ${stats.twilio_balance?.toFixed(2)} USD
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sin conexión</Badge>
                    )}
                    <Badge variant="outline">{stats?.numeros_comprados || 0} números</Badge>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Empresas (futuro) */}
        <Card className="opacity-60 cursor-not-allowed h-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-1">Empresas & Usuarios</h4>
                <p className="text-sm text-slate-500 mb-3">
                  Gestiona las cuentas de clientes
                </p>
                <Badge variant="outline">Próximamente</Badge>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <h3 className="text-lg font-semibold text-slate-900 mt-8">Estado del Sistema</h3>
      
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-slate-900">Stripe</p>
                <p className="text-sm text-slate-500">Pagos conectados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats?.twilio_connected ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-slate-900">Twilio</p>
                <p className="text-sm text-slate-500">
                  {stats?.twilio_connected ? 'WhatsApp activo' : 'Verificar credenciales'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-slate-900">Facturama</p>
                <p className="text-sm text-slate-500">CFDI conectado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
