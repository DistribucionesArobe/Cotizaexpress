import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Store, Package, MessageSquare, Rocket,
  ChevronRight, ChevronLeft, Plus, Trash2,
  Check, Sparkles, ArrowRight, Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com';
const API = `${BACKEND_URL}/api`;

const GIROS = [
  'Ferretería',
  'Materiales de construcción',
  'Plomería',
  'Electricidad',
  'Pinturas',
  'Herrería',
  'Refaccionaria',
  'Servicios técnicos',
  'Otro',
];

const STEPS = [
  { icon: Store, title: 'Tu Negocio', desc: 'Cuéntanos sobre tu empresa' },
  { icon: Package, title: 'Tus Productos', desc: 'Agrega tus primeros productos' },
  { icon: MessageSquare, title: 'WhatsApp', desc: 'Conecta tu numero' },
  { icon: Rocket, title: '¡Listo!', desc: 'Activa tu CotizaBot' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Business info
  const [businessData, setBusinessData] = useState({
    giro: '',
    ciudad: '',
    descripcion: '',
    whatsapp: '',
    horario_semana: '08:00-18:00',
    horario_sabado: '08:00-14:00',
    horario_domingo: 'cerrado',
  });

  // WhatsApp Embedded Signup state
  const [waConnected, setWaConnected] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [fbReady, setFbReady] = useState(false);

  // Load Facebook SDK
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) {
      if (window.FB) setFbReady(true);
      return;
    }
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1461694011992339',
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      setFbReady(true);
    };
    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    js.async = true;
    js.defer = true;
    document.body.appendChild(js);
  }, []);

  // Listen for Embedded Signup session info
  const handleWAMessage = useCallback((event) => {
    if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') return;
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        if (data.event === 'FINISH') {
          const { phone_number_id, waba_id } = data.data;
          console.log('WA Embedded Signup finished:', { phone_number_id, waba_id });
          // Store for use in the token exchange
          window.__wa_signup_data = { phone_number_id, waba_id };
        } else if (data.event === 'CANCEL') {
          console.log('WA Embedded Signup cancelled');
          setWaConnecting(false);
        } else if (data.event === 'ERROR') {
          console.error('WA Embedded Signup error:', data.data);
          toast.error('Error al conectar WhatsApp. Intenta de nuevo.');
          setWaConnecting(false);
        }
      }
    } catch (e) {
      // Not a JSON message, ignore
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleWAMessage);
    return () => window.removeEventListener('message', handleWAMessage);
  }, [handleWAMessage]);

  const launchWhatsAppSignup = () => {
    if (!fbReady || !window.FB) {
      toast.error('Cargando Facebook SDK, intenta en un momento...');
      return;
    }
    setWaConnecting(true);
    window.__wa_signup_data = null;

    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const code = response.authResponse.code;
          const signupData = window.__wa_signup_data || {};
          // Send code + signup data to our backend
          axios.post(`${API}/whatsapp/embedded-signup`, {
            code,
            phone_number_id: signupData.phone_number_id,
            waba_id: signupData.waba_id,
          }, { withCredentials: true })
            .then((res) => {
              setWaConnected(true);
              setWaPhone(res.data?.phone_display || '');
              toast.success('¡WhatsApp conectado exitosamente!');
            })
            .catch((err) => {
              console.error('Embedded signup backend error:', err);
              toast.error(err?.response?.data?.detail || 'Error al conectar WhatsApp');
            })
            .finally(() => setWaConnecting(false));
        } else {
          console.log('User cancelled login');
          setWaConnecting(false);
        }
      },
      {
        config_id: '1877916580262483',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: 3,
        },
      }
    );
  };

  // Step 2: Products
  const [products, setProducts] = useState([
    { nombre: '', precio: '' },
    { nombre: '', precio: '' },
    { nombre: '', precio: '' },
  ]);

  const addProduct = () => {
    if (products.length < 10) {
      setProducts([...products, { nombre: '', precio: '' }]);
    }
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const validProducts = products.filter(p => p.nombre.trim() && p.precio);

  // Step 1 → save business info
  const saveBusiness = async () => {
    if (!businessData.giro) {
      toast.error('Selecciona el giro de tu negocio');
      return false;
    }
    if (!businessData.whatsapp || businessData.whatsapp.length < 10) {
      toast.error('Ingresa tu número de WhatsApp (10 dígitos)');
      return false;
    }
    try {
      setSaving(true);
      await axios.put(`${API}/empresa/perfil`, {
        giro: businessData.giro,
        ciudad: businessData.ciudad,
        descripcion: businessData.descripcion,
        telefono: businessData.whatsapp,
        horario_semana: businessData.horario_semana,
        horario_sabado: businessData.horario_sabado,
        horario_domingo: businessData.horario_domingo,
      }, { withCredentials: true });
      return true;
    } catch (err) {
      // Silently continue if endpoint doesn't exist yet
      console.warn('Business save:', err?.response?.status);
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Step 2 → save products
  const saveProducts = async () => {
    if (validProducts.length === 0) {
      toast.error('Agrega al menos un producto con nombre y precio');
      return false;
    }
    try {
      setSaving(true);
      const items = validProducts.map(p => ({
        name: p.nombre.trim(),
        price: parseFloat(p.precio),
        unit: 'Pieza',
        category: 'General',
      }));
      await axios.post(`${API}/pricebook/bulk`, { items }, { withCredentials: true });
      toast.success(`${items.length} producto(s) guardados`);
      return true;
    } catch (err) {
      console.warn('Products save:', err?.response?.status);
      toast.error('Error al guardar productos, pero puedes continuar');
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await axios.post(`${API}/empresa/onboarding-complete`, {}, { withCredentials: true });
    } catch (err) {
      console.warn('Onboarding complete:', err?.response?.status);
    }
    toast.success('¡Bienvenido a CotizaBot!');
    navigate('/dashboard');
  };

  const nextStep = async () => {
    if (step === 0) {
      const ok = await saveBusiness();
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await saveProducts();
      if (!ok) return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const empresaNombre = user?.empresa?.nombre || user?.usuario?.empresa_nombre || 'tu negocio';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-8 w-auto" />
            <span className="font-bold text-slate-900">CotizaBot</span>
          </div>
          <span className="text-sm text-slate-500">Configuración inicial</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                i === step
                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                  : i < step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-1 ${
                  i < step ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">

            {/* ── STEP 0: Business Info ── */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    ¡Hola, {user?.usuario?.nombre?.split(' ')[0] || 'bienvenido'}!
                  </h2>
                  <p className="text-slate-600 mt-1">
                    Cuéntanos sobre <strong>{empresaNombre}</strong> para configurar tu bot.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿A qué se dedica tu negocio? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GIROS.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setBusinessData({ ...businessData, giro: g })}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                          businessData.giro === g
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ciudad o Estado
                  </label>
                  <input
                    type="text"
                    value={businessData.ciudad}
                    onChange={(e) => setBusinessData({ ...businessData, ciudad: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ej: Monterrey, NL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ¿Qué productos vendes principalmente? (Opcional)
                  </label>
                  <textarea
                    value={businessData.descripcion}
                    onChange={(e) => setBusinessData({ ...businessData, descripcion: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ej: Tablaroca, perfiles, tornillería, pastas..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    WhatsApp de tu negocio *
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Este es el número donde tus clientes te escriben. Lo conectaremos al bot.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 bg-slate-100 px-3 py-2.5 rounded-lg border border-slate-300">+52</span>
                    <input
                      type="tel"
                      value={businessData.whatsapp}
                      onChange={(e) => setBusinessData({ ...businessData, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="10 dígitos (ej: 8112345678)"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Horario de atención
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Lun - Vie</label>
                      <input
                        type="text"
                        value={businessData.horario_semana}
                        onChange={(e) => setBusinessData({ ...businessData, horario_semana: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="08:00-18:00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Sábado</label>
                      <input
                        type="text"
                        value={businessData.horario_sabado}
                        onChange={(e) => setBusinessData({ ...businessData, horario_sabado: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="08:00-14:00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Domingo</label>
                      <input
                        type="text"
                        value={businessData.horario_domingo}
                        onChange={(e) => setBusinessData({ ...businessData, horario_domingo: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="cerrado"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Products ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Agrega tus productos</h2>
                  <p className="text-slate-600 mt-1">
                    Solo nombre y precio. Después podrás editar todo desde el dashboard.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
                    <span className="col-span-7">Nombre del producto</span>
                    <span className="col-span-3">Precio (sin IVA)</span>
                    <span className="col-span-2"></span>
                  </div>

                  {products.map((p, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={p.nombre}
                        onChange={(e) => updateProduct(i, 'nombre', e.target.value)}
                        className="col-span-7 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder={`Producto ${i + 1}`}
                      />
                      <div className="col-span-3 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          value={p.precio}
                          onChange={(e) => updateProduct(i, 'precio', e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(i)}
                        className="col-span-2 p-2 text-slate-400 hover:text-red-500 transition-colors flex justify-center"
                        disabled={products.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {products.length < 10 && (
                  <button
                    type="button"
                    onClick={addProduct}
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="w-4 h-4" /> Agregar otro producto
                  </button>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <strong>Tip:</strong> No necesitas agregar todo tu catálogo ahora.
                  Puedes cargar productos por Excel después desde el dashboard.
                </div>
              </div>
            )}

            {/* ── STEP 2: Connect WhatsApp ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Conecta tu WhatsApp</h2>
                  <p className="text-slate-600 mt-1">
                    Vincula tu número de WhatsApp Business para que el bot empiece a responder.
                  </p>
                </div>

                {waConnected ? (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-700">WhatsApp conectado</h3>
                      {waPhone && <p className="text-slate-600 mt-1">{waPhone}</p>}
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Tu bot ya tiene los <strong>{validProducts.length || 0} productos</strong> y est&aacute; listo para recibir mensajes.
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                      <div className="space-y-3 text-left max-w-sm mx-auto">
                        {[
                          'Inicia sesion con tu cuenta de Facebook',
                          'Selecciona o crea tu WhatsApp Business Account',
                          'Verifica tu numero de telefono',
                        ].map((txt, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <p className="text-sm text-slate-700">{txt}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={launchWhatsAppSignup}
                        disabled={waConnecting}
                        size="lg"
                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold px-8 py-6 text-base"
                      >
                        {waConnecting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Conectando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.237 0-4.308-.744-5.977-1.998l-.418-.312-3.087 1.034 1.034-3.087-.312-.418A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                            </svg>
                            Conectar mi WhatsApp
                          </span>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-slate-400">
                      Necesitas una cuenta de Facebook y un numero de WhatsApp Business
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Ready! ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">¡Todo listo!</h2>
                  <p className="text-slate-600 mt-1">
                    Tu CotizaBot está configurado. Esto es lo que sigue:
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      num: '1',
                      title: waConnected ? 'WhatsApp conectado' : 'Conecta tu WhatsApp',
                      desc: waConnected
                        ? 'Tu bot ya esta recibiendo mensajes en tu numero de WhatsApp.'
                        : 'Puedes conectar tu WhatsApp desde el dashboard en cualquier momento.',
                      color: 'emerald',
                    },
                    {
                      num: '2',
                      title: 'Completa tu catalogo',
                      desc: 'Puedes agregar mas productos desde el dashboard, uno por uno o por archivo Excel.',
                      color: 'blue',
                    },
                    {
                      num: '3',
                      title: 'Tus clientes empiezan a cotizar',
                      desc: 'Comparte tu numero de WhatsApp y tus clientes podran pedir cotizaciones automaticas.',
                      color: 'purple',
                    },
                  ].map((item) => (
                    <div key={item.num} className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl">
                      <div className={`w-8 h-8 bg-${item.color}-100 text-${item.color}-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                        {item.num}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-center text-white">
                  <h3 className="text-lg font-bold mb-1">Todo listo</h3>
                  <p className="text-emerald-100 text-sm mb-4">
                    Tu bot de WhatsApp está configurado. Activa tu plan para empezar a recibir pedidos.
                  </p>
                  <Button
                    onClick={completeOnboarding}
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8"
                  >
                    Ir a mi Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            {step < 3 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors ${
                    step === 0 ? 'invisible' : ''
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>

                <div className="flex items-center gap-3">
                  {step < 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      className="text-sm text-slate-400 hover:text-slate-600"
                    >
                      Omitir
                    </button>
                  )}
                  <Button
                    onClick={nextStep}
                    disabled={saving}
                    className="px-6"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </div>
                    ) : (
                      <span className="flex items-center gap-1">
                        Continuar <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
