import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CreditCard, Building2, Bell, Save, Lock, 
  CheckCircle, AlertCircle, Phone, Mail, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ConfigCobros() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  // Form states
  const [datosBancarios, setDatosBancarios] = useState({
    banco: '',
    beneficiario: '',
    clabe: '',
    cuenta: ''
  });
  
  const [mercadoPagoToken, setMercadoPagoToken] = useState('');
  
  const [notificaciones, setNotificaciones] = useState({
    whatsapp: '',
    email: ''
  });

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/empresa/config-cobros`);
      setConfig(response.data);
      
      // Pre-llenar datos si existen
      if (response.data.spei?.banco) {
        setDatosBancarios({
          banco: response.data.spei.banco || '',
          beneficiario: response.data.spei.beneficiario || '',
          clabe: '', // No mostramos CLABE completa por seguridad
          cuenta: ''
        });
      }
    } catch (error) {
      console.error('Error cargando config:', error);
      if (error.response?.status === 403) {
        setConfig({ tiene_plan_pro: false, plan: 'completo' });
      }
    } finally {
      setLoading(false);
    }
  };

  const guardarDatosBancarios = async () => {
    if (!datosBancarios.banco || !datosBancarios.beneficiario || !datosBancarios.clabe) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    
    if (datosBancarios.clabe.replace(/\s/g, '').length !== 18) {
      toast.error('La CLABE debe tener 18 dígitos');
      return;
    }

    try {
      setGuardando(true);
      await axios.put(`${API}/empresa/datos-bancarios`, datosBancarios);
      toast.success('Datos bancarios guardados');
      await cargarConfig();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const configurarMercadoPago = async () => {
    if (!mercadoPagoToken) {
      toast.error('Ingresa tu Access Token de Mercado Pago');
      return;
    }

    try {
      setGuardando(true);
      await axios.put(`${API}/empresa/config-mercadopago`, {
        access_token: mercadoPagoToken
      });
      toast.success('Mercado Pago configurado correctamente');
      setMercadoPagoToken('');
      await cargarConfig();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Token inválido');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Si no tiene Plan Pro
  if (!config?.tiene_plan_pro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Configuración de Cobros</h2>
            <p className="text-slate-600">Recibe pagos de tus clientes por WhatsApp</p>
          </div>
        </div>

        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="py-12 text-center">
            <Lock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Función exclusiva del Plan Pro
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Con el Plan Pro ($2,000 + IVA/mes) puedes cobrar a tus clientes directamente desde WhatsApp con Mercado Pago o transferencia SPEI.
            </p>
            <Link to="/precios">
              <Button className="bg-amber-500 hover:bg-amber-600">
                Ver Plan Pro - $2,320/mes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="config-cobros-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración de Cobros</h2>
          <p className="text-slate-600">Recibe pagos de tus clientes por WhatsApp</p>
        </div>
        <Badge className="ml-auto bg-amber-500">Plan Pro</Badge>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border-2 ${config?.spei?.configurado ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Building2 className={`w-8 h-8 ${config?.spei?.configurado ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <p className="font-medium text-slate-900">Transferencia SPEI</p>
                <p className="text-sm text-slate-600">
                  {config?.spei?.configurado ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Configurado - CLABE: {config.spei.clabe_oculta}
                    </span>
                  ) : (
                    <span className="text-slate-400">No configurado</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${config?.mercadopago?.configurado ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CreditCard className={`w-8 h-8 ${config?.mercadopago?.configurado ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <p className="font-medium text-slate-900">Mercado Pago</p>
                <p className="text-sm text-slate-600">
                  {config?.mercadopago?.configurado ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Conectado
                    </span>
                  ) : (
                    <span className="text-slate-400">No configurado</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración SPEI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Datos Bancarios (SPEI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Estos datos se enviarán automáticamente a tu cliente cuando confirme una cotización y elija pagar por transferencia.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Banco *</label>
              <Input
                placeholder="Ej: BBVA, Banorte, Santander"
                value={datosBancarios.banco}
                onChange={(e) => setDatosBancarios(prev => ({ ...prev, banco: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Beneficiario *</label>
              <Input
                placeholder="Nombre del titular de la cuenta"
                value={datosBancarios.beneficiario}
                onChange={(e) => setDatosBancarios(prev => ({ ...prev, beneficiario: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">CLABE Interbancaria (18 dígitos) *</label>
              <Input
                placeholder="012345678901234567"
                value={datosBancarios.clabe}
                onChange={(e) => setDatosBancarios(prev => ({ ...prev, clabe: e.target.value.replace(/\D/g, '').slice(0, 18) }))}
                maxLength={18}
              />
              <p className="text-xs text-slate-500 mt-1">
                {datosBancarios.clabe.length}/18 dígitos
              </p>
            </div>
          </div>

          <Button 
            onClick={guardarDatosBancarios} 
            disabled={guardando}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Datos Bancarios
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Configuración Mercado Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Mercado Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Conecta tu cuenta de Mercado Pago para generar links de pago automáticos con tarjeta de crédito/débito.
          </p>

          {config?.mercadopago?.configurado ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Mercado Pago conectado correctamente</span>
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                Los links de pago se generarán automáticamente.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">¿Cómo obtener tu Access Token?</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Ve a <a href="https://www.mercadopago.com.mx/developers/panel/app" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a></li>
                  <li>Crea una aplicación o selecciona una existente</li>
                  <li>Ve a "Credenciales de producción"</li>
                  <li>Copia el "Access Token"</li>
                </ol>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Access Token de Producción</label>
                <Input
                  type="password"
                  placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={mercadoPagoToken}
                  onChange={(e) => setMercadoPagoToken(e.target.value)}
                />
              </div>

              <Button 
                onClick={configurarMercadoPago} 
                disabled={guardando || !mercadoPagoToken}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {guardando ? 'Verificando...' : 'Conectar Mercado Pago'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            Notificaciones de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Recibe una notificación cada vez que un cliente realice un pago.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp para notificaciones
              </label>
              <Input
                placeholder="+52 81 1234 5678"
                value={notificaciones.whatsapp}
                onChange={(e) => setNotificaciones(prev => ({ ...prev, whatsapp: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Recibirás un mensaje cuando te paguen
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email para notificaciones
              </label>
              <Input
                type="email"
                placeholder="pagos@tuempresa.com"
                value={notificaciones.email}
                onChange={(e) => setNotificaciones(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Recibirás un email de confirmación
              </p>
            </div>
          </div>

          <Button variant="outline" disabled>
            <Save className="w-4 h-4 mr-2" />
            Guardar Notificaciones (Próximamente)
          </Button>
        </CardContent>
      </Card>

      {/* Cómo funciona */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">¿Cómo funciona el cobro por WhatsApp?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Tu cliente confirma la cotización por WhatsApp</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>CotizaBot pregunta: "¿Cómo deseas pagar? 1. Tarjeta (Mercado Pago) 2. Transferencia SPEI"</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>Según su elección, se envía el link de pago o los datos bancarios automáticamente</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span>Recibes notificación cuando el pago se confirme</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
