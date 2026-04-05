import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Store, Package, MessageSquare, Rocket,
  ChevronRight, ChevronLeft, Plus, Trash2,
  Check, Sparkles, ArrowRight
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
  { icon: MessageSquare, title: 'Prueba el Bot', desc: 'Mira cómo funciona' },
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

            {/* ── STEP 2: Try the Bot ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Así funciona tu CotizaBot</h2>
                  <p className="text-slate-600 mt-1">
                    Tus clientes mandan un mensaje y el bot responde al instante.
                  </p>
                </div>

                {/* WhatsApp demo mockup */}
                <div className="bg-[#ECE5DD] rounded-2xl p-4 max-w-sm mx-auto shadow-inner">
                  <div className="bg-[#075E54] text-white px-4 py-3 rounded-t-xl -mx-4 -mt-4 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                      {empresaNombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{empresaNombre}</span>
                  </div>

                  {/* Client message */}
                  <div className="flex justify-end mb-2">
                    <div className="bg-[#DCF8C6] rounded-lg px-3 py-2 max-w-[80%] shadow-sm">
                      <p className="text-sm text-slate-800">Hola, necesito cotización de 10 bultos de cemento y 5 varillas 3/8</p>
                      <span className="text-[10px] text-slate-500 float-right mt-1">10:30 AM</span>
                    </div>
                  </div>

                  {/* Bot typing */}
                  <div className="flex justify-start mb-2">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Bot response */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-3 py-2 max-w-[85%] shadow-sm">
                      <p className="text-sm text-slate-800">
                        ¡Hola! Aquí tienes tu cotización:
                      </p>
                      <div className="mt-2 bg-slate-50 rounded p-2 text-xs font-mono">
                        <p>10 Cemento Cruz Azul - $2,100.00</p>
                        <p>5 Varilla 3/8 - $425.00</p>
                        <p className="border-t mt-1 pt-1 font-bold">Subtotal: $2,525.00</p>
                        <p>IVA (16%): $404.00</p>
                        <p className="text-emerald-700 font-bold">Total: $2,929.00</p>
                      </div>
                      <span className="text-[10px] text-slate-500 float-right mt-1">10:30 AM</span>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Tu bot ya tiene los <strong>{validProducts.length || 0} productos</strong> que acabas de cargar.
                    Nosotros conectaremos tu WhatsApp en menos de 24 horas.
                  </div>
                </div>
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
                      title: 'Conectamos tu WhatsApp',
                      desc: 'Nuestro equipo conectará tu número de WhatsApp en menos de 24 horas. Te contactaremos por correo.',
                      color: 'emerald',
                    },
                    {
                      num: '2',
                      title: 'Completa tu catálogo',
                      desc: 'Puedes agregar más productos desde el dashboard, uno por uno o por archivo Excel.',
                      color: 'blue',
                    },
                    {
                      num: '3',
                      title: 'Tus clientes empiezan a cotizar',
                      desc: 'Comparte tu número de WhatsApp y tus clientes podrán pedir cotizaciones automáticas.',
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
