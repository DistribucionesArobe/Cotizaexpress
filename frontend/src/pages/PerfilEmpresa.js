import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GIROS = [
  'Ferretería',
  'Materiales de construcción',
  'Plomería',
  'Electricidad',
  'Pinturas',
  'Herrería',
  'Refaccionaria',
  'Mueblería',
  'Papelería',
  'Servicios técnicos',
  'Otro',
];

export default function PerfilEmpresa() {
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
    marcas_propias: '',
    marcas_competencia: '',
    giro: '',
    giro_otro: '',
  });

  const [horario, setHorario] = useState({
    lunes_viernes: '08:00-18:00',
    sabado: '08:00-14:00',
    domingo: 'cerrado',
  });

  const [modulos, setModulos] = useState({ construccion_ligera: false, rejacero: false, pintura: false, impermeabilizante: false });
  const [guardandoModulo, setGuardandoModulo] = useState(false);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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
        welcome_message: s.welcome_message || '',
        giro: s.giro || '',
        giro_otro: s.giro_otro || '',
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

      // Sync: telefono_atencion → owner_phone for backward compatibility
      const phoneToSave = formData.telefono_atencion || '';
      await axios.post(`${API}/company/settings`, {
        ...formData,
        owner_phone: phoneToSave,
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

        {/* Marcas y Competencia */}
        <Card>
          <CardHeader>
            <CardTitle>🏷️ Marcas y Competencia</CardTitle>
            <p className="text-sm text-slate-500">Cuando un cliente pida productos de la competencia, el bot buscará el equivalente en tus marcas.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marcas que manejas</Label>
                <textarea
                  name="marcas_propias"
                  value={formData.marcas_propias}
                  onChange={handleChange}
                  placeholder="Ej: USG, Redimix, Coflex, Truper"
                  className="w-full min-h-[60px] px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <p className="text-xs text-slate-400">Separa con comas las marcas principales de tus productos</p>
              </div>
              <div className="space-y-2">
                <Label>Marcas de tu competencia</Label>
                <textarea
                  name="marcas_competencia"
                  value={formData.marcas_competencia}
                  onChange={handleChange}
                  placeholder="Ej: Panel Rey, Crest, Rugo, Surtej"
                  className="w-full min-h-[60px] px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <p className="text-xs text-slate-400">Marcas que tus clientes mencionan pero tú no vendes</p>
              </div>
            </div>
            {/* AI Suggestions */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingSuggestions || !formData.marcas_propias?.trim()}
                  onClick={async () => {
                    setLoadingSuggestions(true);
                    setBrandSuggestions([]);
                    try {
                      const res = await axios.post(`${API}/company/suggest-brands`, {
                        marcas_propias: formData.marcas_propias,
                      });
                      const existing = (formData.marcas_competencia || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
                      const filtered = (res.data?.suggestions || []).filter(s => !existing.includes(s.toLowerCase()));
                      setBrandSuggestions(filtered);
                      if (!filtered.length) toast.info('No hay sugerencias nuevas');
                    } catch (e) {
                      toast.error('Error al obtener sugerencias');
                    } finally {
                      setLoadingSuggestions(false);
                    }
                  }}
                  className="text-xs"
                >
                  {loadingSuggestions ? (
                    <><span className="animate-spin mr-1">⏳</span> Analizando...</>
                  ) : (
                    <><span className="mr-1">✨</span> Sugerir competencia con IA</>
                  )}
                </Button>
                <span className="text-xs text-slate-400">Basado en tus marcas, te sugiere competidores</span>
              </div>
              {brandSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {brandSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="px-3 py-1 text-xs rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      onClick={() => {
                        const current = (formData.marcas_competencia || '').trim();
                        const updated = current ? `${current}, ${s}` : s;
                        setFormData({ ...formData, marcas_competencia: updated });
                        setBrandSuggestions(prev => prev.filter((_, j) => j !== i));
                        toast.success(`"${s}" agregado`);
                      }}
                    >
                      + {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      const current = (formData.marcas_competencia || '').trim();
                      const all = brandSuggestions.join(', ');
                      const updated = current ? `${current}, ${all}` : all;
                      setFormData({ ...formData, marcas_competencia: updated });
                      setBrandSuggestions([]);
                      toast.success('Todas las sugerencias agregadas');
                    }}
                  >
                    Agregar todas
                  </button>
                </div>
              )}
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