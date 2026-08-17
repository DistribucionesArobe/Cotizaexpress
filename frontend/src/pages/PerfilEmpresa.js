import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GIROS = [
  'Ferretería',
  'Materiales de construcción',
  'Plomería',
  'Material eléctrico',
  'Pinturas',
  'Herrería',
  'Refaccionaria',
  'Distribuidora',
  'Mueblería',
  'Papelería',
  'Abarrotes / Mayoreo',
  'Servicios técnicos',
  'Otro',
];

const SUPER_ADMINS = ['ealejandro.robledo@gmail.com'];

export default function PerfilEmpresa() {
  const { user } = useAuth();
  const isSuperAdmin = SUPER_ADMINS.includes((user?.email || '').toLowerCase());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [company, setCompany] = useState(null);
  const fileInputRef = useRef(null);
  const [waPreview, setWaPreview] = useState(null);
  const [waPreviewMode, setWaPreviewMode] = useState(null); // 'solo' | 'cotizabot'
  const [loadingPreview, setLoadingPreview] = useState(false);

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
    brand_color: '#059669',
    marcas_propias: '',
    marcas_competencia: '',
    giro: '',
    giro_otro: '',
  });

  const [horario, setHorario] = useState({
    lunes_viernes: { open: '08:00', close: '18:00', closed: false },
    sabado: { open: '08:00', close: '14:00', closed: false },
    domingo: { open: '08:00', close: '14:00', closed: true },
  });

  // Horario de atención HUMANA (cuando hay asesores disponibles)
  const [atencionActiva, setAtencionActiva] = useState(false);
  const [atencionHumana, setAtencionHumana] = useState({
    tz: 'America/Mexico_City',
    lunes_viernes: { open: '09:00', close: '18:00', closed: false },
    sabado: { open: '09:00', close: '14:00', closed: false },
    domingo: { open: '09:00', close: '14:00', closed: true },
  });

  const [modulos, setModulos] = useState({ construccion_ligera: false, rejacero: false, pintura: false, impermeabilizante: false });

  // Equipo (multi-admin)
  const [teamUsers, setTeamUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  const cargarEquipo = async () => {
    try {
      const r = await axios.get(`${API}/company/users`);
      setTeamUsers(r.data?.users || []);
    } catch (_) {}
  };

  const agregarUsuario = async () => {
    if (!newUserEmail.trim() || !newUserPass.trim()) {
      toast.error('Email y contraseña son requeridos');
      return;
    }
    try {
      setAddingUser(true);
      await axios.post(`${API}/company/users`, {
        email: newUserEmail.trim(),
        password: newUserPass,
      });
      toast.success(`Usuario ${newUserEmail.trim()} agregado`);
      setNewUserEmail('');
      setNewUserPass('');
      cargarEquipo();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al agregar usuario');
    } finally {
      setAddingUser(false);
    }
  };

  const eliminarUsuario = async (userId, email) => {
    if (!window.confirm(`¿Eliminar el acceso de ${email}?`)) return;
    try {
      await axios.delete(`${API}/company/users/${userId}`);
      toast.success('Usuario eliminado');
      cargarEquipo();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al eliminar');
    }
  };
  const [guardandoModulo, setGuardandoModulo] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarEquipo();
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

      const _rawName = c.name || c.nombre || '';
      const _nombreComercial = (!_rawName || _rawName.includes('@')) ? 'Mi empresa' : _rawName;
      setFormData({
        company_name: _nombreComercial,
        email: s.email || '',
        rfc: s.rfc || '',
        owner_phone: s.owner_phone || '',
        telefono_atencion: (s.telefono_atencion || s.owner_phone || '').replace(/^\+?52/, '').replace(/\D/g, '').slice(-10),
        marcas_propias: s.marcas_propias || '',
        marcas_competencia: s.marcas_competencia || '',
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
        welcome_message: s.welcome_message || `Hola, bienvenido a ${_nombreComercial} 👋`,
        brand_color: s.brand_color || '#059669',
        giro: s.giro || '',
        giro_otro: s.giro_otro || '',
      });

      // Parsear horario desde hours_text (regex robusto: soporta el formato viejo con |)
      if (s.hours_text) {
        const parseDay = (re, fallback) => {
          const m = s.hours_text.match(re);
          if (!m) return fallback;
          const seg = m[1];
          if (/cerrado/i.test(seg)) return { ...fallback, closed: true };
          const t = seg.match(/(\d{1,2}:\d{2})\s*[-a]\s*(\d{1,2}:\d{2})/);
          if (!t) return fallback;
          const pad = (x) => (x.length === 4 ? '0' + x : x);
          return { open: pad(t[1]), close: pad(t[2]), closed: false };
        };
        setHorario({
          lunes_viernes: parseDay(/lunes[^:]*:\s*([^|\n]+)/i, { open: '08:00', close: '18:00', closed: false }),
          sabado: parseDay(/s[áa]bado[^:]*:\s*([^|\n]+)/i, { open: '08:00', close: '14:00', closed: false }),
          domingo: parseDay(/domingo[^:]*:\s*([^|\n]+)/i, { open: '08:00', close: '14:00', closed: true }),
        });
      }

      // Cargar horario de atención humana (attention_schedule JSON)
      if (s.attention_schedule?.days) {
        const d = s.attention_schedule.days;
        const toDay = (day, fb) => (!day || day.closed || !day.open)
          ? { ...fb, closed: true }
          : { open: day.open, close: day.close, closed: false };
        setAtencionActiva(true);
        setAtencionHumana({
          tz: s.attention_schedule.tz || 'America/Mexico_City',
          lunes_viernes: toDay(d.mon, { open: '09:00', close: '18:00' }),
          sabado: toDay(d.sat, { open: '09:00', close: '14:00' }),
          domingo: toDay(d.sun, { open: '09:00', close: '14:00' }),
        });
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

      // Construir hours_text desde el horario (objetos con time pickers)
      const fmtDay = (d) => (d.closed ? 'cerrado' : `${d.open}-${d.close}`);
      const hours_text = `Lunes a Viernes: ${fmtDay(horario.lunes_viernes)}\nSábado: ${fmtDay(horario.sabado)}\nDomingo: ${fmtDay(horario.domingo)}`;

      // Construir attention_schedule (horario con asesores)
      let attention_schedule = null;
      if (atencionActiva) {
        const toApi = (d) => (d.closed ? { closed: true } : { open: d.open, close: d.close, closed: false });
        const lv = toApi(atencionHumana.lunes_viernes);
        const sab = toApi(atencionHumana.sabado);
        const dom = toApi(atencionHumana.domingo);
        attention_schedule = {
          tz: atencionHumana.tz || 'America/Mexico_City',
          days: { mon: lv, tue: lv, wed: lv, thu: lv, fri: lv, sat: sab, sun: dom },
        };
      } else {
        attention_schedule = {};
      }

      // Sync: telefono_atencion → owner_phone for backward compatibility
      const phoneToSave = formData.telefono_atencion || '';
      await axios.post(`${API}/company/settings`, {
        ...formData,
        owner_phone: phoneToSave,
        hours_text,
        attention_schedule,
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
      const resp = await axios.post(`${API}/company/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Logo actualizado');
      if (resp.data?.wa_profile_updated === true) {
        toast.success('Foto de perfil de WhatsApp actualizada');
      } else if (resp.data?.wa_profile_updated === false) {
        toast.error('No se pudo actualizar la foto de WhatsApp');
      }
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

            {/* CotizaBot branding toggle for WhatsApp */}
            {settings?.logo_url && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Foto de perfil de WhatsApp</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading || loadingPreview}
                    onClick={async () => {
                      try {
                        setLoadingPreview(true);
                        setWaPreviewMode('solo');
                        const r = await axios.get(`${API}/company/logo/wa-preview?with_cotizabot=false`);
                        if (r.data?.preview) setWaPreview(r.data.preview);
                        else toast.error('Error al generar preview');
                      } catch { toast.error('Error al generar preview'); }
                      finally { setLoadingPreview(false); }
                    }}
                  >
                    Solo mi logo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={uploading || loadingPreview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      try {
                        setLoadingPreview(true);
                        setWaPreviewMode('cotizabot');
                        const r = await axios.get(`${API}/company/logo/wa-preview?with_cotizabot=true`);
                        if (r.data?.preview) setWaPreview(r.data.preview);
                        else toast.error('Error al generar preview');
                      } catch { toast.error('Error al generar preview'); }
                      finally { setLoadingPreview(false); }
                    }}
                  >
                    <img src="/logo-cotizabot.png" alt="" className="w-5 h-5 mr-1.5 inline-block" />
                    Combinar con CotizaBot
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Elige cómo se ve tu foto de perfil en WhatsApp</p>

                {/* Preview */}
                {(waPreview || loadingPreview) && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600 mb-3">
                      Vista previa {waPreviewMode === 'cotizabot' ? '(con CotizaBot)' : '(solo tu logo)'}
                    </p>
                    <div className="flex items-start gap-4">
                      {loadingPreview ? (
                        <div className="w-32 h-32 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                      ) : (
                        <div className="flex-shrink-0">
                          <img
                            src={waPreview}
                            alt="Preview"
                            className="w-32 h-32 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                          />
                          <p className="text-[10px] text-slate-400 text-center mt-1">Así se ve en WhatsApp</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={uploading || loadingPreview}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={async () => {
                            try {
                              setUploading(true);
                              const withCb = waPreviewMode === 'cotizabot';
                              const r = await axios.post(`${API}/company/logo/update-wa-profile?with_cotizabot=${withCb}`);
                              if (r.data?.ok) {
                                toast.success('Foto de perfil de WhatsApp actualizada');
                                setWaPreview(null);
                                setWaPreviewMode(null);
                              } else toast.error('Error al actualizar');
                            } catch { toast.error('Error al actualizar'); }
                            finally { setUploading(false); }
                          }}
                        >
                          {uploading ? 'Aplicando...' : 'Aplicar a WhatsApp'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => { setWaPreview(null); setWaPreviewMode(null); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Color de marca */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="font-medium text-slate-900 mb-1">Color de marca</p>
              <p className="text-sm text-slate-500 mb-3">Se usa en tus cotizaciones PDF (encabezado, tabla y total).</p>
              <div className="flex items-center gap-2 flex-wrap">
                {['#059669', '#2563eb', '#dc2626', '#ea580c', '#7c3aed', '#db2777', '#334155', '#111827'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, brand_color: c }))}
                    className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                      (formData.brand_color || '').toLowerCase() === c ? 'border-slate-900 scale-110' : 'border-white shadow'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <label className="flex items-center gap-2 ml-2 cursor-pointer text-sm text-slate-600">
                  <input
                    type="color"
                    value={formData.brand_color || '#059669'}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                    className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  Otro color
                </label>
              </div>
              {/* Vista previa */}
              <div className="mt-4 max-w-sm border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 text-white text-sm font-bold flex justify-between items-center" style={{ backgroundColor: formData.brand_color || '#059669' }}>
                  <span>{formData.company_name || 'Mi empresa'}</span>
                  <span className="font-normal text-xs opacity-80">COTIZACIÓN CX-EJEMPLO</span>
                </div>
                <div className="px-4 py-2 text-xs text-slate-500 bg-white">Así se verá el encabezado de tus cotizaciones.</div>
                <div className="px-4 py-2 text-white text-sm font-bold flex justify-between" style={{ backgroundColor: formData.brand_color || '#059669' }}>
                  <span>TOTAL (IVA incluido)</span><span>$869.50</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">Recuerda picar "Guardar" al final para aplicar el cambio.</p>
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
              <Label>Giro del negocio</Label>
              <div className="flex flex-wrap gap-2">
                {GIROS.map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      formData.giro === g
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                    }`}
                    onClick={() => setFormData({ ...formData, giro: g, ...(g !== 'Otro' ? { giro_otro: '' } : {}) })}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {formData.giro === 'Otro' && (
                <Input
                  name="giro_otro"
                  value={formData.giro_otro}
                  onChange={handleChange}
                  placeholder="Ej: Mueblería, Tlapalería, Abarrotera..."
                  className="mt-2"
                />
              )}
              <p className="text-xs text-slate-500">El bot usa tu giro para entender mejor la jerga de tu industria</p>
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
              <Label>Teléfono de Atención (WhatsApp)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-medium select-none">+52</span>
                <Input
                  name="telefono_atencion"
                  value={formData.telefono_atencion}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, telefono_atencion: v });
                  }}
                  placeholder="10 dígitos"
                  maxLength={10}
                  className="rounded-l-none"
                />
              </div>
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
          <CardHeader>
            <CardTitle>⏰ Horario de Atención</CardTitle>
            <p className="text-sm text-slate-500">El horario público de tu negocio — el bot lo comparte cuando el cliente pregunta.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[['lunes_viernes', 'Lunes a Viernes'], ['sabado', 'Sábado'], ['domingo', 'Domingo']].map(([key, label]) => (
              <div key={key} className="flex flex-wrap items-center gap-3 p-3 border rounded-lg">
                <span className="font-medium text-slate-700 w-36">{label}</span>
                <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={horario[key].closed}
                    onChange={e => setHorario(prev => ({ ...prev, [key]: { ...prev[key], closed: e.target.checked } }))}
                    className="w-4 h-4 accent-slate-500"
                  />
                  Cerrado
                </label>
                {!horario[key].closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={horario[key].open}
                      onChange={e => setHorario(prev => ({ ...prev, [key]: { ...prev[key], open: e.target.value } }))}
                      className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                    />
                    <span className="text-slate-400">a</span>
                    <input
                      type="time"
                      value={horario[key].close}
                      onChange={e => setHorario(prev => ({ ...prev, [key]: { ...prev[key], close: e.target.value } }))}
                      className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Horario con asesores (atención humana) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>👥 Horario con asesores</CardTitle>
              <button
                type="button"
                onClick={() => setAtencionActiva(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${atencionActiva ? 'bg-emerald-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${atencionActiva ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Horas en las que hay personas atendiendo. Fuera de este horario, el bot
              le dice al cliente cuándo lo contactarán y le ofrece cotizar mientras tanto.
            </p>
          </CardHeader>
          {atencionActiva && (
            <CardContent className="space-y-3">
              {[['lunes_viernes', 'Lunes a Viernes'], ['sabado', 'Sábado'], ['domingo', 'Domingo']].map(([key, label]) => (
                <div key={key} className="flex flex-wrap items-center gap-3 p-3 border rounded-lg">
                  <span className="font-medium text-slate-700 w-36">{label}</span>
                  <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={atencionHumana[key].closed}
                      onChange={e => setAtencionHumana(prev => ({ ...prev, [key]: { ...prev[key], closed: e.target.checked } }))}
                      className="w-4 h-4 accent-slate-500"
                    />
                    Sin asesores
                  </label>
                  {!atencionHumana[key].closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={atencionHumana[key].open}
                        onChange={e => setAtencionHumana(prev => ({ ...prev, [key]: { ...prev[key], open: e.target.value } }))}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                      />
                      <span className="text-slate-400">a</span>
                      <input
                        type="time"
                        value={atencionHumana[key].close}
                        onChange={e => setAtencionHumana(prev => ({ ...prev, [key]: { ...prev[key], close: e.target.value } }))}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-2 space-y-1">
                <Label>Zona horaria</Label>
                <select
                  value={atencionHumana.tz}
                  onChange={e => setAtencionHumana(prev => ({ ...prev, tz: e.target.value }))}
                  className="w-full md:w-64 h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="America/Mexico_City">Centro (CDMX, Tamaulipas, etc.)</option>
                  <option value="America/Monterrey">Monterrey</option>
                  <option value="America/Chihuahua">Pacífico (Chihuahua, BCS)</option>
                  <option value="America/Tijuana">Noroeste (Tijuana)</option>
                  <option value="America/Cancun">Sureste (Cancún)</option>
                </select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Equipo (multi-admin) */}
        <Card>
          <CardHeader><CardTitle>👤 Equipo</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Agrega más personas de tu equipo con acceso a este panel.
              Cada quien entra con su propio email y contraseña, y ven la misma
              empresa: catálogo, cotizaciones y configuración.
            </p>
            <div className="space-y-2 mb-4">
              {teamUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{u.email}</p>
                    {u.created_at && <p className="text-xs text-slate-400">Desde {u.created_at.slice(0, 10)}</p>}
                  </div>
                  {teamUsers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => eliminarUsuario(u.id, u.email)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label>Email del nuevo usuario</Label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="persona@tuempresa.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Contraseña (mín. 8 caracteres)</Label>
                <Input
                  type="password"
                  value={newUserPass}
                  onChange={e => setNewUserPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="button"
                onClick={agregarUsuario}
                disabled={addingUser}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {addingUser ? 'Agregando...' : '+ Agregar usuario'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Módulos */}
        <Card>
          <CardHeader><CardTitle>🔧 Módulos</CardTitle></CardHeader>
          <CardContent>
            {isSuperAdmin && (<>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-slate-800">Construccion Ligera <span className="text-xs text-amber-600 font-normal">(solo CotizaExpress)</span></p>
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
                <p className="font-medium text-slate-800">Rejacero <span className="text-xs text-amber-600 font-normal">(solo CotizaExpress)</span></p>
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
            </>)}
            <div className={`flex items-center justify-between p-4 border rounded-lg ${isSuperAdmin ? 'mt-3' : ''}`}>
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