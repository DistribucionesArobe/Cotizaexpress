import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [metricas, setMetricas] = useState(null);
  const [cotizacionesRecientes, setCotizacionesRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try{
      const [metricasRes, cotizacionesRes] = await Promise.all([
        axios.get(`${API}/dashboard/metricas`),
        axios.get(`${API}/dashboard/cotizaciones-recientes?limit=5`)
      ]);

      setMetricas(metricasRes.data);
      setCotizacionesRecientes(cotizacionesRes.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-container">
      {/* Título */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">Vista general del sistema CotizaBot</p>
      </div>

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