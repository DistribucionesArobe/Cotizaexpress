import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { FileText, Crown, Plus, Eye, Send, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Cotizaciones() {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');

  const planActual = user?.empresa?.plan || user?.usuario?.plan || 'gratis';
  const esPlanGratis = planActual === 'gratis' || planActual === 'demo';

  useEffect(() => {
    cargarCotizaciones();
  }, [filtroEstado]);

  const cargarCotizaciones = async () => {
    try {
      const url = filtroEstado
        ? `${API}/cotizaciones?estado=${filtroEstado}`
        : `${API}/cotizaciones`;
      const response = await axios.get(url);
      setCotizaciones(response.data);
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
      toast.error('Error cargando cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const enviarCotizacion = async (cotizacionId) => {
    try {
      await axios.post(`${API}/cotizaciones/enviar`, {
        cotizacion_id: cotizacionId,
      });
      toast.success('Cotización enviada por WhatsApp');
      cargarCotizaciones();
    } catch (error) {
      console.error('Error enviando cotización:', error);
      toast.error('Error enviando cotización');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12" data-testid="cotizaciones-loading">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6" data-testid="cotizaciones-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Cotizaciones</h2>
          <p className="text-slate-600 mt-1">Gestiona todas las cotizaciones generadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          data-testid="filter-all"
          variant={filtroEstado === '' ? 'default' : 'outline'}
          onClick={() => setFiltroEstado('')}
        >
          Todas
        </Button>
        <Button
          data-testid="filter-enviada"
          variant={filtroEstado === 'enviada' ? 'default' : 'outline'}
          onClick={() => setFiltroEstado('enviada')}
        >
          Enviadas
        </Button>
        <Button
          data-testid="filter-ganada"
          variant={filtroEstado === 'ganada' ? 'default' : 'outline'}
          onClick={() => setFiltroEstado('ganada')}
        >
          Ganadas
        </Button>
        <Button
          data-testid="filter-perdida"
          variant={filtroEstado === 'perdida' ? 'default' : 'outline'}
          onClick={() => setFiltroEstado('perdida')}
        >
          Perdidas
        </Button>
      </div>

      {/* Lista de Cotizaciones */}
      <div className="grid gap-4">
        {cotizaciones.length === 0 ? (
          <div className="space-y-6">
            {/* Mensaje y ejemplo de cotización */}
            <Card className="border-2 border-dashed border-slate-300">
              <CardContent className="py-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Aún no tienes cotizaciones
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Las cotizaciones se crean automáticamente cuando tus clientes 
                    te escriben por WhatsApp. Aquí te mostramos un ejemplo de cómo se verían:
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ejemplo de cotización */}
            <div className="relative">
              <div className="absolute -top-3 left-4 z-10">
                <Badge className="bg-blue-600">
                  <Eye className="w-3 h-3 mr-1" />
                  Ejemplo de cotización
                </Badge>
              </div>
              
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white" data-testid="ejemplo-cotizacion">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">COT-2024-0001</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        Juan Pérez - +52 81 1234 5678
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      enviada
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Productos ejemplo */}
                    <div className="border border-slate-200 rounded-lg p-3 bg-white">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Productos:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">10 x Cemento gris 50kg</span>
                          <span className="font-medium">$1,980.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">50 x Varilla 3/8" x 12m</span>
                          <span className="font-medium">$6,250.00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">100 x Block hueco 15x20x40</span>
                          <span className="font-medium">$1,250.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Totales */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <div className="text-sm text-slate-600">
                        <p>Subtotal: $9,480.00</p>
                        <p>IVA (16%): $1,516.80</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">$10,996.80</p>
                        <p className="text-xs text-slate-500">MXN</p>
                      </div>
                    </div>

                    {/* Botones de ejemplo */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </Button>
                      <Button className="flex-1 bg-emerald-600" disabled>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar por WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA para plan */}
            {esPlanGratis && (
              <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">¿Listo para recibir cotizaciones automáticas?</h4>
                        <p className="text-sm text-slate-600">
                          Con el Plan Completo, CotizaBot responde a tus clientes 24/7 por WhatsApp
                        </p>
                      </div>
                    </div>
                    <Link to="/precios">
                      <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="btn-ver-plan">
                        Ver Plan Completo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          cotizaciones.map((cot) => (
            <Card key={cot.id} data-testid={`cotizacion-${cot.folio}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cot.folio}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {cot.cliente_nombre} - {cot.cliente_telefono}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cot.estado === 'ganada'
                        ? 'bg-emerald-100 text-emerald-700'
                        : cot.estado === 'enviada'
                        ? 'bg-blue-100 text-blue-700'
                        : cot.estado === 'perdida'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {cot.estado}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Productos */}
                  <div className="border border-slate-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Productos:</h4>
                    <div className="space-y-1">
                      {cot.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            {item.cantidad} x {item.producto_nombre}
                          </span>
                          <span className="font-medium">
                            ${item.subtotal.toLocaleString('es-MX')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      <p>Subtotal: ${cot.subtotal.toLocaleString('es-MX')}</p>
                      <p>IVA: ${cot.iva.toLocaleString('es-MX')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        ${cot.total.toLocaleString('es-MX')}
                      </p>
                      <p className="text-xs text-slate-500">MXN</p>
                    </div>
                  </div>

                  {/* Acciones */}
                  {cot.estado === 'borrador' && (
                    <Button
                      data-testid={`btn-enviar-${cot.folio}`}
                      className="w-full"
                      onClick={() => enviarCotizacion(cot.id)}
                    >
                      Enviar por WhatsApp
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}