import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, Calendar, DollarSign, Package, Clock, Building2, Phone, Mail, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const estadoColores = {
  borrador: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
  enviada: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  aceptada: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  rechazada: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  vencida: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle }
};

export default function PortalCliente() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API}/portal/cotizacion/${token}`);
        setData(response.data);
      } catch (err) {
        console.error('Error:', err);
        if (err.response?.status === 404) {
          setError('Este enlace no es válido o ha expirado.');
        } else if (err.response?.status === 410) {
          setError('Este enlace ha expirado. Solicita uno nuevo al proveedor.');
        } else {
          setError('Error al cargar la cotización. Intenta de nuevo más tarde.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCotizacion();
  }, [token]);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const response = await axios.get(`${API}/portal/cotizacion/${token}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cotizacion_${data.cotizacion.folio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error descargando PDF:', err);
      alert('No se pudo descargar el PDF. Intenta de nuevo.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center" data-testid="portal-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" data-testid="portal-error">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Enlace no válido</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <a 
            href="https://cotizaexpress.com" 
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Ir a CotizaExpress
          </a>
        </div>
      </div>
    );
  }

  const { cotizacion, empresa } = data;
  const estadoConfig = estadoColores[cotizacion.estado] || estadoColores.borrador;
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-testid="portal-cotizacion">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {empresa?.logo_url && (
                <img 
                  src={`${BACKEND_URL}${empresa.logo_url}`}
                  alt={empresa?.nombre}
                  className="h-10 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="font-bold text-slate-900">{empresa?.nombre || 'Cotización'}</h1>
                <p className="text-xs text-slate-500">Portal de Cotizaciones</p>
              </div>
            </div>
            
            <span className="text-xs text-slate-400">
              Powered by CotizaBot
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Cotización Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Header de cotización */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm mb-1">Cotización</p>
                <h2 className="text-2xl font-bold" data-testid="cotizacion-folio">{cotizacion.folio}</h2>
              </div>
              <div className={`px-4 py-2 rounded-full ${estadoConfig.bg} ${estadoConfig.text} flex items-center gap-2`}>
                <EstadoIcon className="h-4 w-4" />
                <span className="text-sm font-medium capitalize">{cotizacion.estado}</span>
              </div>
            </div>
          </div>

          {/* Info del cliente */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <p className="text-sm text-slate-600">
              Preparada para: <span className="font-semibold text-slate-900">{cotizacion.cliente_nombre}</span>
            </p>
            <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(cotizacion.created_at)}
              </span>
              {cotizacion.valida_hasta && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Válida hasta: {formatDate(cotizacion.valida_hasta)}
                </span>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="px-6 py-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Productos Cotizados
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="cotizacion-items">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="pb-3 font-medium">Producto</th>
                    <th className="pb-3 font-medium text-center">Cantidad</th>
                    <th className="pb-3 font-medium text-right">Precio Unit.</th>
                    <th className="pb-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.items?.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 last:border-0">
                      <td className="py-4">
                        <p className="font-medium text-slate-900">{item.producto_nombre}</p>
                        {item.descripcion && (
                          <p className="text-sm text-slate-500">{item.descripcion}</p>
                        )}
                      </td>
                      <td className="py-4 text-center text-slate-700">
                        {item.cantidad} {item.unidad || 'pz'}
                      </td>
                      <td className="py-4 text-right text-slate-700">
                        {formatCurrency(item.precio_unitario)}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cotizacion.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA (16%):</span>
                    <span>{formatCurrency(cotizacion.iva)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-emerald-600 pt-2 border-t border-slate-200">
                    <span>Total:</span>
                    <span data-testid="cotizacion-total">{formatCurrency(cotizacion.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {cotizacion.notas && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-1">Notas:</p>
                <p className="text-sm text-amber-700">{cotizacion.notas}</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="btn-download-pdf"
            >
              <Download className="h-5 w-5" />
              {downloadingPdf ? 'Descargando...' : 'Descargar PDF'}
            </button>
            
            {/* Contacto empresa */}
            {empresa && (
              <div className="text-right text-sm text-slate-600">
                <p className="font-medium text-slate-900 mb-1">¿Tienes preguntas?</p>
                {empresa.telefono && (
                  <a href={`tel:${empresa.telefono}`} className="flex items-center gap-1 justify-end text-emerald-600 hover:text-emerald-700">
                    <Phone className="h-4 w-4" />
                    {empresa.telefono}
                  </a>
                )}
                {empresa.email && (
                  <a href={`mailto:${empresa.email}`} className="flex items-center gap-1 justify-end text-emerald-600 hover:text-emerald-700">
                    <Mail className="h-4 w-4" />
                    {empresa.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Cotización generada con{' '}
            <a href="https://cotizaexpress.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
              CotizaBot by CotizaExpress.com
            </a>
          </p>
          <p className="mt-1">Sistema de cotizaciones automáticas para tu negocio</p>
        </div>
      </main>
    </div>
  );
}
