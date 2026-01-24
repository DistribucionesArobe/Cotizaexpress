import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Phone, DollarSign, AlertTriangle, CheckCircle, 
  ArrowLeft, RefreshCw, Calendar, Building2,
  MessageSquare, Clock, Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminTwilio() {
  const { user } = useAuth();
  const [twilioData, setTwilioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const esAdmin = user?.usuario?.rol === 'admin';

  useEffect(() => {
    if (esAdmin) {
      cargarTwilioData();
    }
  }, [esAdmin]);

  const cargarTwilioData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      const response = await axios.get(`${API}/admin/twilio`);
      setTwilioData(response.data);
      
      if (showToast) toast.success('Datos actualizados');
    } catch (error) {
      console.error('Error cargando datos de Twilio:', error);
      if (error.response?.status === 403) {
        toast.error('No tienes permisos de administrador');
      } else {
        toast.error('Error al cargar datos de Twilio');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const balance = twilioData?.balance || 0;
  const balanceLow = balance < 10;
  const balanceCritical = balance < 5;

  return (
    <div className="space-y-6" data-testid="admin-twilio-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Twilio & WhatsApp</h2>
            <p className="text-slate-600">Saldo, números y configuración</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => cargarTwilioData(true)}
          disabled={refreshing}
          data-testid="btn-refresh-twilio"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Alerta de saldo bajo */}
      {balanceLow && (
        <Card className={`${balanceCritical ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${balanceCritical ? 'text-red-600' : 'text-amber-600'}`} />
              <div>
                <p className={`font-semibold ${balanceCritical ? 'text-red-800' : 'text-amber-800'}`}>
                  {balanceCritical ? '🚨 Saldo crítico' : '⚠️ Saldo bajo'}
                </p>
                <p className={`text-sm ${balanceCritical ? 'text-red-700' : 'text-amber-700'}`}>
                  {balanceCritical 
                    ? 'Tu cuenta podría quedarse sin fondos pronto. Recarga inmediatamente.'
                    : 'Considera recargar tu cuenta de Twilio para evitar interrupciones.'
                  }
                </p>
              </div>
              <a 
                href="https://console.twilio.com/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button size="sm" variant={balanceCritical ? 'destructive' : 'default'}>
                  Recargar ahora
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={balanceLow ? 'border-2 border-amber-300' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                balanceCritical ? 'bg-red-100' : balanceLow ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                <DollarSign className={`w-7 h-7 ${
                  balanceCritical ? 'text-red-600' : balanceLow ? 'text-amber-600' : 'text-emerald-600'
                }`} />
              </div>
              <div>
                <p className={`text-3xl font-bold ${
                  balanceCritical ? 'text-red-600' : balanceLow ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  ${balance.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">Saldo USD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {twilioData?.numeros_activos || 0}
                </p>
                <p className="text-sm text-slate-500">Números activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {twilioData?.mensajes_mes || 0}
                </p>
                <p className="text-sm text-slate-500">Mensajes este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de la cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {twilioData?.connected ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-slate-900">Conexión API</p>
                <p className="text-sm text-slate-500">
                  {twilioData?.connected ? 'Conectado correctamente' : 'Error de conexión'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900">Última actualización</p>
                <p className="text-sm text-slate-500">
                  {twilioData?.last_updated 
                    ? new Date(twilioData.last_updated).toLocaleString('es-MX')
                    : 'Ahora'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de números comprados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Números comprados</CardTitle>
            <Badge variant="outline">{twilioData?.numeros?.length || 0} números</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!twilioData?.numeros || twilioData.numeros.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Phone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay números comprados aún</p>
              <p className="text-sm">Los números se compran automáticamente cuando un cliente activa su Plan Completo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {twilioData.numeros.map((numero, index) => (
                <div 
                  key={numero.sid || index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  data-testid={`numero-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-slate-900">{numero.phone_number}</p>
                      <p className="text-sm text-slate-500">{numero.friendly_name || 'CotizaBot'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {numero.empresa_nombre && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4" />
                        <span>{numero.empresa_nombre}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {numero.date_created 
                          ? new Date(numero.date_created).toLocaleDateString('es-MX')
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <Badge variant={numero.status === 'in-use' ? 'default' : 'secondary'}>
                      {numero.status === 'in-use' ? 'Activo' : numero.status || 'Activo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info de costos */}
      <Card className="bg-slate-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-slate-500 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-1">Costos estimados de Twilio</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Número mexicano: ~$1.15 USD/mes</li>
                <li>Mensaje WhatsApp enviado: ~$0.005 - $0.05 USD</li>
                <li>Mensaje WhatsApp recibido: Gratis</li>
              </ul>
              <a 
                href="https://www.twilio.com/whatsapp/pricing/mx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline mt-2 inline-block"
              >
                Ver precios actualizados →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
