import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PerfilEmpresa() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [company, setCompany] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    rfc: '',
    owner_phone: '',
    telefono_atencion: '',
    address_text: '',
    hours_text: '',
    google_maps_url: '',
    mercadopago_url: '',
    bank_name: '',
    bank_account_name: '',
    bank_clabe: '',
    bank_account_number: '',
    discount_threshold: '',
    discount_percent: '',
    welcome_message: '',
  });

  const [horario, setHorario] = useState({
    lunes_viernes: '08:00-18:00',
    sabado: '08:00-14:00',
    domingo: 'cerrado',
  });

  const [modulos, setModulos] = useState({ construccion_ligera: false, rejacero: false, pintura: false, impermeabilizante: false });
  const [guardandoModulo, setGuardandoModulo] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [settingsRes, companyRes] = await Promise.all([
        axios.get(`${API}/company/settings`),
        axios.get(`${API}/company/me`),
      ]);

      const s = settingsRes.data?.settings || {};
      const c = companyRes.data?.company || {};
      setSettings(s);
      setCompany(c);

      setFormData({
        company_name: c.name || c.nombre || '',
        email: s.email || '',
        rfc: s.rfc || '',
        owner_phone: s.owner_phone || '',
        telefono_atencion: s.telefono_atencion || '',
        address_text: s.address_text || '',
        hours_text: s.hours_text || '',
        google_maps_url: s.google_maps_url || '',
        mercadopago_url: s.mercadopago_url || '',
        bank_name: s.bank_name || '',
        bank_account_name: s.bank_account_name || '',
        bank_clabe: s.bank_clabe || '',
        bank_account_number: s.bank_account_number || '',
        discount_threshold: s.discount_threshold || '',
        discount_percent: s.discount_percent || '',
        welcome_message: s.welcome_message || '',
      });

      // Parsear horario desde hours_text si existe
      if (s.hours_text) {
        const lines = s.hours_text.split('\n');
        const h = { lunes_viernes: '08:00-18:00', sabado: '08:00-14:00', domingo: 'cerrado' };
        lines.forEach(line => {
          if (line.toLowerCase().includes('lunes')) h.lunes_viernes = line.split(':').slice(1).join(':').trim();
          if (line.toLowerCase().includes('sábado') || line.toLowerCase().includes('sabado')) h.sabado = line.split(':').slice(1).join(':').trim();
          if (line.toLowerCase().includes('domingo')) h.domingo = line.split(':').slice(1).join(':').trim();
        });
        setHorario(h);
      }

      // Module toggles
      try {
        const conn = await axios.get(`${API}/company/me`);
        setModulos({
          construccion_ligera: conn.data?.company?.construccion_ligera_enabled || false,
          rejacero: conn.data?.company?.rejacero_enabled || false,
          pintura: conn.data?.company?.pintura_enabled || false,
          impermeabilizante: conn.data?.company?.impermeabilizante_enabled || false,
        });
      } catch (_) {}

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Construir hours_text desde el horario
      const hours_text = `Lunes a Viernes: ${horario.lunes_viernes}\nSábado: ${horario.sabado}\nDomingo: ${horario.domingo}`;

      await axios.post(`${API}/company/settings`, {
        ...formData,
        hours_text,
        discount_threshold: formData.discount_threshold ? parseFloat(formData.discount_threshold) : null,
        discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
      });
      toast.success('Configuración guardada');
      cargarDatos();
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleModulo = async (modulo, valor) => {
    try {
      setGuardandoModulo(true);
      // Guardamos en company settings como campo extra
      const fieldMap = { construccion_ligera: 'construccion_ligera_enabled', rejacero: 'rejacero_enabled', pintura: 'pintura_enabled', impermeabilizante: 'impermeabilizante_enabled' };
      await axios.post(`${API}/company/settings`, { [fieldMap[modulo] || modulo]: valor });
      setModulos(prev => ({ ...prev, [modulo]: valor }));
      toast.success('Módulo actualizado');
    } catch (e) {
      toast.error('Error al actualizar módulo');
    } finally {
      setGuardandoModulo(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa PNG, JPG o WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 2MB');
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      await axios.post(`${API}/company/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Logo actualizado');
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al subir logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('¿Eliminar el logo?')) return;
    try {
      setUploading(true);
      await axios.delete(`${API}/company/logo`);
      toast.success('Logo eliminado');
      cargarDatos();
    } catch (error) {
      toast.error('Error al eliminar logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Empresa</h1>
        <p className="text-slate-600">Configura la información de tu empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader><CardTitle>Logo de la Empresa</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-slate-400 text-xs text-center">Click para subir</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleLogoChange} />
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Subiendo...' : 'Subir Logo'}
                </Button>
                {settings?.logo_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleDeleteLogo} disabled={uploading} className="text-red-600 block">
                    Eliminar
                  </Button>
                )}
                <p className="text-xs text-slate-500">PNG, JPG o WEBP. Máx 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de empresa */}
        <Card>
          <CardHeader><CardTitle>Datos de la Empresa</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nombre Comercial</Label>
              <Input name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Ej: Aceromax" />
              <p className="text-xs text-slate-500">Este nombre aparece en el saludo del bot de WhatsApp</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mensaje de bienvenida (WhatsApp)</Label>
              <textarea
                name="welcome_message"
                value={formData.welcome_message}
                onChange={handleChange}
                placeholder="Ej: ¡Hola! Bienvenido a Aceromax, ¿en qué te puedo ayudar?"
                className="w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-slate-500">Personaliza el saludo que reciben tus clientes en WhatsApp. Si lo dejas vacío usará: "¡Hola! Soy el asistente de [tu nombre comercial]"</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" value={formData.email} onChange={handleChange} placeholder="contacto@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>RFC</Label>
              <Input name="rfc" value={formData.rfc} onChange={handleChange} placeholder="XAXX010101000" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono del Dueño (WhatsApp)</Label>
              <Input name="owner_phone" value={formData.owner_phone} onChange={handleChange} placeholder="+5281XXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de Atención al Cliente</Label>
              <Input name="telefono_atencion" value={formData.telefono_atencion} onChange={handleChange} placeholder="+5281XXXXXXXX" />
              <p className="text-xs text-slate-400">Cuando un cliente pide hablar con alguien, el bot le da este número como link de WhatsApp</p>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input name="address_text" value={formData.address_text} onChange={handleChange} placeholder="Calle Principal #123, Monterrey" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>URL Google Maps</Label>
              <Input name="google_maps_url" value={formData.google_maps_url} onChange={handleChange} placeholder="https://maps.google.com/..." />
            </div>
          </CardContent>
        </Card>

        {/* Horario de Atención */}
        <Card>
          <CardHeader><CardTitle>⏰ Horario de Atención</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[['lunes_viernes', 'Lunes a Viernes'], ['sabado', 'Sábado'], ['domingo', 'Domingo']].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    value={horario[key] || ''}
                    onChange={e => setHorario(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder='08:00-18:00 o "cerrado"'
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Formato: 08:00-18:00 o "cerrado"</p>
          </CardContent>
        </Card>

        {/* Módulos */}
        <Card>
          <CardHeader><CardTitle>🔧 Módulos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-slate-800">Construccion Ligera</p>
                <p className="text-sm text-slate-500">Activa para habilitar el módulo de materiales de construcción ligera (tablaroca, plafón, perfiles, etc.)</p>
              </div>
              <button
                type="button"
                onClick={() => toggleModulo('construccion_ligera', !modulos.construccion_ligera)}
                disabled={guardandoModulo}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${modulos.construccion_ligera ? 'bg-emerald-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${modulos.construccion_ligera ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg mt-3">
              <div>
                <p className="font-medium text-slate-800">Rejacero</p>
                <p className="text-sm text-slate-500">Activa para habilitar el calculador de reja ciclónica por WhatsApp (metros lineales → rejas, postes, abrazaderas)</p>
              </div>
              <button
                type="button"
                onClick={() => toggleModulo('rejacero', !modulos.rejacero)}
                disabled={guardandoModulo}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${modulos.rejacero ? 'bg-emerald-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${modulos.rejacero ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg mt-3">
              <div>
                <p className="font-medium text-slate-800">Pintura</p>
                <p className="text-sm text-slate-500">Activa para habilitar el calculador de pintura por WhatsApp (m² → cubetas, galones, litros de vinílica o esmalte)</p>
              </div>
              <button
                type="button"
                onClick={() => toggleModulo('pintura', !modulos.pintura)}
                disabled={guardandoModulo}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${modulos.pintura ? 'bg-emerald-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${modulos.pintura ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg mt-3">
              <div>
                <p className="font-medium text-slate-800">Impermeabilizante</p>
                <p className="text-sm text-slate-500">Activa para habilitar el calculador de impermeabilizante por WhatsApp (m² → litros/cubetas + malla de refuerzo)</p>
              </div>
              <button
                type="button"
                onClick={() => toggleModulo('impermeabilizante', !modulos.impermeabilizante)}
                disabled={guardandoModulo}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${modulos.impermeabilizante ? 'bg-emerald-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${modulos.impermeabilizante ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Cobros */}
        <Card>
          <CardHeader><CardTitle>💳 Cobros</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL de MercadoPago</Label>
              <Input name="mercadopago_url" value={formData.mercadopago_url} onChange={handleChange} placeholder="https://www.mercadopago.com.mx/checkout/..." />
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="BBVA, Banorte, etc." />
            </div>
            <div className="space-y-2">
              <Label>Nombre del Titular</Label>
              <Input name="bank_account_name" value={formData.bank_account_name} onChange={handleChange} placeholder="Empresa SA de CV" />
            </div>
            <div className="space-y-2">
              <Label>CLABE (18 dígitos)</Label>
              <Input name="bank_clabe" value={formData.bank_clabe} onChange={handleChange} placeholder="012345678901234567" maxLength={18} />
            </div>
            <div className="space-y-2">
              <Label>Número de Cuenta</Label>
              <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="1234567890" />
            </div>
          </CardContent>
        </Card>

        {/* Descuentos por volumen */}
        <Card>
          <CardHeader><CardTitle>🏷️ Descuento por Volumen</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto mínimo para descuento ($)</Label>
              <Input name="discount_threshold" type="number" value={formData.discount_threshold} onChange={handleChange} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label>Porcentaje de descuento (%)</Label>
              <Input name="discount_percent" type="number" value={formData.discount_percent} onChange={handleChange} placeholder="5" min="0" max="100" />
            </div>
            <p className="text-xs text-slate-500 md:col-span-2">Cuando el total supere el monto mínimo, se aplica el descuento automáticamente en el bot.</p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}