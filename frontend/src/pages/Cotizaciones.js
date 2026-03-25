import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    cargarCotizaciones();
  }, [page]);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/quotes?limit=${LIMIT}&offset=${page * LIMIT}`);
      setCotizaciones(response.data.quotes || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error cargando cotizaciones:', error);
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (folio) => {
    try {
      const response = await axios.get(`${API}/quotes/${folio}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cotizacion_${folio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al descargar PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Cotizaciones</h2>
        <p className="text-slate-600 mt-1">{total} cotizaciones generadas</p>
      </div>

      {cotizaciones.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay cotizaciones aún</h3>
            <p className="text-slate-500">Las cotizaciones generadas por el bot de WhatsApp aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {cotizaciones.map((cot) => (
              <Card key={cot.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Folio: {cot.folio}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {cot.client_phone?.replace('whatsapp:', '') || 'Sin teléfono'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cot.created_at ? new Date(cot.created_at).toLocaleString('es-MX') : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-slate-900">
                        ${cot.total?.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => descargarPDF(cot.folio)}
                        className="text-emerald-700 border-emerald-300"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}>
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}