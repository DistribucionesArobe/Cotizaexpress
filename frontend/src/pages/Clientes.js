import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await axios.get(`${API}/clientes`);
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12" data-testid="clientes-loading">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6" data-testid="clientes-container">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Clientes</h2>
        <p className="text-slate-600 mt-1">{clientes.length} clientes registrados</p>
      </div>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {clientes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">No hay clientes registrados</p>
            </CardContent>
          </Card>
        ) : (
          clientes.map((cliente) => (
            <Card key={cliente.id} data-testid={`cliente-${cliente.telefono}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {cliente.nombre || 'Cliente sin nombre'}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{cliente.telefono}</p>
                    {cliente.empresa && (
                      <p className="text-sm text-slate-500">{cliente.empresa}</p>
                    )}
                  </div>
                  {cliente.email && (
                    <Badge variant="secondary">{cliente.email}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {cliente.total_cotizaciones}
                    </p>
                    <p className="text-xs text-slate-500">Cotizaciones</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {cliente.total_ventas}
                    </p>
                    <p className="text-xs text-slate-500">Ventas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      ${cliente.monto_total.toLocaleString('es-MX')}
                    </p>
                    <p className="text-xs text-slate-500">Total MXN</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}