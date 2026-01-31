import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, Copy, QrCode, ExternalLink, Share2, 
  Zap, Phone, Settings
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [metricas, setMetricas] = useState(null);
  const [cotizacionesRecientes, setCotizacionesRecientes] = useState([]);
  const [whatsappConfig, setWhatsappConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activandoWA, setActivandoWA] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try{
      const [metricasRes, cotizacionesRes, whatsappRes] = await Promise.all([
        axios.get(`${API}/dashboard/metricas`),
        axios.get(`${API}/dashboard/cotizaciones-recientes?limit=5`),
        axios.get(`${API}/whatsapp/configuracion`).catch(() => ({ data: null }))
      ]);

      setMetricas(metricasRes.data);
      setCotizacionesRecientes(cotizacionesRes.data);
      setWhatsappConfig(whatsappRes.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copiarTexto = (texto) => {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        toast.success('Copiado al portapapeles');
      } else {
        prompt('Copia este texto:', texto);
      }
    } catch (err) {
      document.body.removeChild(textArea);
      prompt('Copia este texto:', texto);
    }
  };

  const activarWhatsApp = async () => {
    try {
      setActivandoWA(true);
      const response = await axios.post(`${API}/whatsapp/activar`, {});
      toast.success('¡WhatsApp activado!');
      setWhatsappConfig(prev => ({
        ...prev,
        configurado: true,
        whatsapp: {
          codigo: response.data.codigo,
          link: response.data.link,
          qr_url: response.data.qr_url,
          instrucciones: response.data.instrucciones
        }
      }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al activar');
    } finally {
      setActivandoWA(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const waConfigured = whatsappConfig?.configurado;
  const waData = whatsappConfig?.whatsapp || {};

  return (
    <div className="space-y-6" data-testid="dashboard-container">
      {/* Título */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">Vista general de CotizaBot</p>
      </div>

      {/* WhatsApp - Sección Principal */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50" data-testid="card-whatsapp">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <MessageCircle className="w-5 h-5" />
              WhatsApp Business
            </CardTitle>
            {waConfigured && (
              <Link to="/configuracion-whatsapp">
                <Button variant="ghost" size="sm" className="text-emerald-700">
                  <Settings className="w-4 h-4 mr-1" />
                  Configuración
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {waConfigured ? (
            <div className="space-y-4">
              {/* Código y acciones rápidas */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Código */}
                <div className="flex-1 bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs text-slate-500 mb-1">Tu código único</p>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-600 text-lg px-3 py-1">{waData.codigo}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copiarTexto(waData.codigo)}
                      className="text-emerald-700 border-emerald-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Link */}
                <div className="flex-1 bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs text-slate-500 mb-1">Link directo</p>
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => copiarTexto(waData.link)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(waData.link, '_blank')}
                      className="border-emerald-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* QR */}
                <div className="bg-white rounded-lg p-3 border border-emerald-200 flex items-center gap-3">
                  <img 
                    src={waData.qr_url} 
                    alt="QR" 
                    className="w-16 h-16 rounded"
                  />
                  <div>
                    <p className="text-xs text-slate-500">Código QR</p>
                    <Link to="/configuracion-whatsapp">
                      <Button variant="link" size="sm" className="p-0 h-auto text-emerald-700">
                        Ver grande →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Número de atención */}
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-white/50 rounded-lg px-3 py-2">
                <Phone className="w-4 h-4" />
                <span>Número de atención:</span>
                <span className="font-semibold">{whatsappConfig?.numero_cotizabot}</span>
              </div>
            </div>
          ) : (
            /* WhatsApp no activado */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Activa WhatsApp</h4>
              <p className="text-sm text-slate-600 mb-4">
                Obtén tu código único, link y QR para que tus clientes cotizen automáticamente.
              </p>
              <Button 
                onClick={activarWhatsApp}
                disabled={activandoWA}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {activandoWA ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Activar WhatsApp Gratis
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-cotizaciones">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Cotizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metricas?.total_cotizaciones || 0}</div>
            <p className="text-xs text-slate-500 mt-2">
              {metricas?.cotizaciones_mes || 0} este mes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-clientes">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{metricas?.total_clientes || 0}</div>
            <p className="text-xs text-slate-500 mt-2">Registrados</p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Tasa Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{metricas?.tasa_conversion || 0}%</div>
            <p className="text-xs text-slate-500 mt-2">Cotizaciones ganadas</p>
          </CardContent>
        </Card>

        <Card data-testid="card-valor">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Valor Cotizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              ${(metricas?.valor_total_cotizado || 0).toLocaleString('es-MX')}
            </div>
            <p className="text-xs text-slate-500 mt-2">MXN</p>
          </CardContent>
        </Card>
      </div>

      {/* Cotizaciones por Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metricas?.cotizaciones_por_estado || {}).map(([estado, count]) => (
                <div key={estado} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      estado === 'ganada' ? 'bg-emerald-500' :
                      estado === 'enviada' ? 'bg-blue-500' :
                      estado === 'perdida' ? 'bg-red-500' :
                      'bg-slate-400'
                    }`}></div>
                    <span className="text-sm capitalize text-slate-700">{estado}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cotizacionesRecientes.map((cot) => (
                <div key={cot.folio} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{cot.folio}</p>
                    <p className="text-xs text-slate-500">{cot.cliente_nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">${cot.total?.toLocaleString('es-MX')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cot.estado === 'ganada' ? 'bg-emerald-100 text-emerald-700' :
                      cot.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {cot.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productos más vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo Activo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-slate-900">{metricas?.total_productos || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Productos disponibles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}