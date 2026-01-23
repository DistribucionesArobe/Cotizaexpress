import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DatosFiscales({ onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [regimenes, setRegimenes] = useState([]);
  const [usosCfdi, setUsosCfdi] = useState([]);
  const [datosFiscales, setDatosFiscales] = useState({
    rfc: '',
    razon_social: '',
    regimen_fiscal: '',
    uso_cfdi: '',
    codigo_postal: '',
    domicilio_fiscal: '',
    email_factura: ''
  });
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar catálogos y datos en paralelo
      const [regimenesRes, usosCfdiRes, datosFiscalesRes, solicitudesRes] = await Promise.all([
        axios.get(`${API}/empresa/catalogos/regimenes-fiscales`),
        axios.get(`${API}/empresa/catalogos/usos-cfdi`),
        axios.get(`${API}/empresa/datos-fiscales`),
        axios.get(`${API}/empresa/solicitudes-factura`)
      ]);
      
      setRegimenes(regimenesRes.data.regimenes || []);
      setUsosCfdi(usosCfdiRes.data.usos_cfdi || []);
      
      if (datosFiscalesRes.data.datos_fiscales) {
        setDatosFiscales({
          rfc: datosFiscalesRes.data.datos_fiscales.rfc || '',
          razon_social: datosFiscalesRes.data.datos_fiscales.razon_social || '',
          regimen_fiscal: datosFiscalesRes.data.datos_fiscales.regimen_fiscal || '',
          uso_cfdi: datosFiscalesRes.data.datos_fiscales.uso_cfdi || '',
          codigo_postal: datosFiscalesRes.data.datos_fiscales.codigo_postal || '',
          domicilio_fiscal: datosFiscalesRes.data.datos_fiscales.domicilio_fiscal || '',
          email_factura: datosFiscalesRes.data.datos_fiscales.email_factura || ''
        });
      }
      
      setSolicitudes(solicitudesRes.data.solicitudes || []);
      
    } catch (error) {
      console.error('Error cargando datos fiscales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosFiscales(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!datosFiscales.rfc || datosFiscales.rfc.length < 12) {
      toast.error('El RFC debe tener al menos 12 caracteres');
      return;
    }
    
    if (!datosFiscales.razon_social) {
      toast.error('La razón social es obligatoria');
      return;
    }
    
    try {
      setSaving(true);
      await axios.put(`${API}/empresa/datos-fiscales`, datosFiscales);
      toast.success('Datos fiscales actualizados');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error guardando datos fiscales:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSolicitarFactura = async () => {
    if (!datosFiscales.rfc || !datosFiscales.razon_social) {
      toast.error('Primero completa el RFC y Razón Social');
      return;
    }
    
    try {
      setSolicitando(true);
      const response = await axios.post(`${API}/empresa/solicitar-factura`, {
        pago_referencia: `SUSCRIPCION-${new Date().toISOString().split('T')[0]}`,
        notas: 'Solicitud de factura por suscripción mensual'
      });
      
      toast.success(response.data.mensaje);
      cargarDatos(); // Recargar solicitudes
    } catch (error) {
      console.error('Error solicitando factura:', error);
      toast.error(error.response?.data?.detail || 'Error al solicitar factura');
    } finally {
      setSolicitando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario de Datos Fiscales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Datos Fiscales para Facturación CFDI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC *</Label>
                <Input
                  id="rfc"
                  name="rfc"
                  value={datosFiscales.rfc}
                  onChange={handleChange}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  className="uppercase"
                  data-testid="input-rfc-fiscal"
                />
                <p className="text-xs text-slate-500">12 caracteres para personas morales, 13 para físicas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  name="razon_social"
                  value={datosFiscales.razon_social}
                  onChange={handleChange}
                  placeholder="Empresa S.A. de C.V."
                  data-testid="input-razon-social"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regimen_fiscal">Régimen Fiscal</Label>
                <select
                  id="regimen_fiscal"
                  name="regimen_fiscal"
                  value={datosFiscales.regimen_fiscal}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  data-testid="select-regimen-fiscal"
                >
                  <option value="">Seleccionar régimen...</option>
                  {regimenes.map((regimen) => (
                    <option key={regimen.codigo} value={`${regimen.codigo} - ${regimen.nombre}`}>
                      {regimen.codigo} - {regimen.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uso_cfdi">Uso CFDI</Label>
                <select
                  id="uso_cfdi"
                  name="uso_cfdi"
                  value={datosFiscales.uso_cfdi}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  data-testid="select-uso-cfdi"
                >
                  <option value="">Seleccionar uso...</option>
                  {usosCfdi.map((uso) => (
                    <option key={uso.codigo} value={`${uso.codigo} - ${uso.nombre}`}>
                      {uso.codigo} - {uso.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  name="codigo_postal"
                  value={datosFiscales.codigo_postal}
                  onChange={handleChange}
                  placeholder="64000"
                  maxLength={5}
                  data-testid="input-codigo-postal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_factura">Email para Facturas</Label>
                <Input
                  id="email_factura"
                  name="email_factura"
                  type="email"
                  value={datosFiscales.email_factura}
                  onChange={handleChange}
                  placeholder="facturas@miempresa.com"
                  data-testid="input-email-factura"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domicilio_fiscal">Domicilio Fiscal</Label>
              <Input
                id="domicilio_fiscal"
                name="domicilio_fiscal"
                value={datosFiscales.domicilio_fiscal}
                onChange={handleChange}
                placeholder="Calle, Número, Colonia, Ciudad, Estado"
                data-testid="input-domicilio-fiscal"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving}
                data-testid="btn-guardar-fiscal"
              >
                {saving ? 'Guardando...' : 'Guardar Datos Fiscales'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Solicitar Factura */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">¿Necesitas factura de tu suscripción?</h3>
              <p className="text-blue-700 text-sm mb-4">
                Completa tus datos fiscales arriba y solicita tu factura CFDI. 
                Te la enviaremos en 24-48 horas hábiles.
              </p>
              <Button
                onClick={handleSolicitarFactura}
                disabled={solicitando || !datosFiscales.rfc || !datosFiscales.razon_social}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="btn-solicitar-factura"
              >
                {solicitando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Solicitando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Solicitar Factura CFDI
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Solicitudes */}
      {solicitudes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solicitudes.slice(0, 5).map((solicitud, index) => (
                <div
                  key={solicitud.id || index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {solicitud.cotizacion_folio || solicitud.pago_referencia || 'Solicitud'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(solicitud.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    solicitud.estado === 'completada' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : solicitud.estado === 'procesando'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {solicitud.estado === 'completada' ? 'Completada' :
                     solicitud.estado === 'procesando' ? 'Procesando' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
