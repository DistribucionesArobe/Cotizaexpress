import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ── Chat Widget (matches LandingPage) ──────────────────────────────
const DEMO_MESSAGES = [
  { from: 'client', text: 'Hola, necesito 10 tablaroca ultralight y 5 bultos de redimix', delay: 0 },
  { from: 'bot', text: '...', typing: true, delay: 800 },
  { from: 'bot', text: '✅ 2 producto(s) cotizados.\nCotización:\n\n• 10 x Tablaroca ultralight USG — $2,450\n• 5 x Redimix 28 kg USG — $3,300\n\nTotal: $5,750 (IVA incluido)\n📋 Folio: CX-7KM2PN\n💳 Escribe *pagar* y te mandamos datos bancarios o link para pago con tarjeta.', delay: 2400 },
];

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasPlayed, setHasPlayed] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && !hasPlayed) {
      setHasPlayed(true);
      setMessages([]);
      DEMO_MESSAGES.forEach((msg) => {
        setTimeout(() => {
          setMessages(prev => {
            if (!msg.typing) {
              const filtered = prev.filter(m => !(m.typing && m.from === msg.from));
              return [...filtered, msg];
            }
            return [...prev, msg];
          });
        }, msg.delay);
      });
    }
  }, [open, hasPlayed]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const replay = () => {
    setMessages([]);
    setTimeout(() => {
      DEMO_MESSAGES.forEach((msg) => {
        setTimeout(() => {
          setMessages(prev => {
            if (!msg.typing) {
              const filtered = prev.filter(m => !(m.typing && m.from === msg.from));
              return [...filtered, msg];
            }
            return [...prev, msg];
          });
        }, msg.delay);
      });
    }, 100);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-white"
             style={{ animation: 'slide-up 0.3s ease-out' }}>
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">CB</div>
              <div>
                <p className="font-semibold text-sm leading-tight">CotizaBot Demo</p>
                <p className="text-[11px] text-emerald-200">En linea</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none p-1">&times;</button>
          </div>
          <div className="h-[320px] overflow-y-auto px-3 py-3 space-y-2"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M0 20h40M20 0v40\' stroke=\'%23e8e5de\' stroke-width=\'.5\' fill=\'none\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'200\' height=\'200\' fill=\'%23ECE5DD\'/%3E%3Crect width=\'200\' height=\'200\' fill=\'url(%23p)\'/%3E%3C/svg%3E")' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-[13px] leading-relaxed shadow-sm whitespace-pre-line ${
                  msg.from === 'client'
                    ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none'
                }`}>
                  {msg.typing ? (
                    <span className="flex gap-1 py-1 px-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-slate-200 px-3 py-3 bg-white flex flex-col gap-2">
            <a
              href="https://wa.me/5218342472640?text=DEMO"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white text-center py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Pruebalo en WhatsApp ahora
            </a>
            <button onClick={replay} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Repetir demo
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
          open ? 'bg-slate-600 hover:bg-slate-700' : 'bg-[#25D366] hover:bg-[#1ebe57]'
        }`}
        style={!open ? { animation: 'float-pulse 3s ease-in-out infinite' } : {}}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
        )}
        <span className="font-semibold text-sm whitespace-nowrap">
          {open ? 'Cerrar' : 'Prueba el bot'}
        </span>
      </button>

      <style>{`
        @keyframes float-pulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// Calculator Functions
const calculatorFunctions = {
  muroTablaroca: (alto, largo) => {
    const m2 = alto * largo;
    const tablaroca = Math.ceil(Math.ceil(m2 / (1.22 * 2.44) * 2 * 1.03) * 1.03);
    const pijas = Math.ceil(tablaroca * 30 / 100) * 100;
    return [
      { name: 'Tablaroca ultralight', qty: tablaroca, unit: 'pza' },
      { name: 'Canal 6.35 x 3.05 cal 26', qty: Math.ceil((largo / 3) * 2), unit: 'pza' },
      { name: 'Poste 6.35 x 3.05 cal 26', qty: (Math.ceil(largo / 0.61) + 1) * (Math.ceil(alto / 3.05) + 1), unit: 'pza' },
      { name: 'Pija 6 x 1', qty: pijas, unit: 'pza' },
      { name: 'Pija framer', qty: Math.ceil(pijas / 2 / 100) * 100, unit: 'pza' },
      { name: 'Perfacinta', qty: Math.ceil((m2 / 2.44) / 20), unit: 'rollo' },
      { name: 'Redimix 21.8 kg', qty: Math.ceil(m2 / 14), unit: 'pza' },
    ];
  },

  muroDurock: (alto, largo) => {
    const m2 = alto * largo;
    const durock = Math.ceil(Math.ceil(m2 / (1.22 * 2.44) * 2 * 1.03) * 1.03);
    const pijas = Math.ceil(durock * 30 / 100) * 100;
    return [
      { name: 'Durock', qty: durock, unit: 'pza' },
      { name: 'Canal 6.35 x 3.05 cal 22', qty: Math.ceil((largo / 3) * 2), unit: 'pza' },
      { name: 'Poste 6.35 x 3.05 cal 20', qty: (Math.ceil(largo / 0.406) + 1) * (Math.ceil(alto / 3.05) + 1), unit: 'pza' },
      { name: 'Pija para durock', qty: pijas, unit: 'pza' },
      { name: 'Pija framer', qty: Math.ceil(pijas / 2 / 100) * 100, unit: 'pza' },
      { name: 'Cinta fibra de vidrio', qty: Math.ceil((m2 / 2.44) / 20), unit: 'rollo' },
      { name: 'Basecoat', qty: Math.ceil(m2 / 4), unit: 'saco' },
    ];
  },

  plafonTablaroca: (largo, ancho) => {
    const m2 = largo * ancho;
    const tablaroca = Math.ceil(m2 / 2.9768 * 1.07);
    const pijas = Math.ceil(tablaroca * 30 / 100) * 100;
    return [
      { name: 'Tablaroca ultralight', qty: tablaroca, unit: 'pza' },
      { name: 'Canal listón cal 26', qty: Math.ceil(((m2 / 0.61) * 1.05) / 3.05) + 2, unit: 'pza' },
      { name: 'Canaleta de carga cal 24', qty: Math.ceil(((m2 / 1.22) * 1.05) / 3.05), unit: 'pza' },
      { name: 'Ángulo de amarre cal 26', qty: Math.ceil(((largo * 2) + (ancho * 2)) / 3.05), unit: 'pza' },
      { name: 'Pija 6 x 1', qty: pijas, unit: 'pza' },
      { name: 'Pija framer', qty: Math.ceil(pijas / 2 / 100) * 100, unit: 'pza' },
      { name: 'Perfacinta', qty: Math.ceil((m2 * 0.8 * 1.05) / 75), unit: 'rollo' },
      { name: 'Redimix 21.8 kg', qty: Math.ceil((m2 * 0.65 * 1.05) / 21.8), unit: 'pza' },
      { name: 'Alambre galvanizado cal 12.5', qty: Math.ceil(m2 / 20), unit: 'rollo' },
    ];
  },

  plafonReticulado: (largo, ancho) => {
    const m2 = largo * ancho;
    return [
      { name: 'Plafón radar 61x61', qty: Math.ceil(m2 / 0.36 * 1.03), unit: 'pza' },
      { name: 'Tee principal', qty: Math.ceil(m2 * 0.29), unit: 'pza' },
      { name: 'Tee 1.22', qty: Math.ceil(m2 * 1.4), unit: 'pza' },
      { name: 'Tee 61', qty: Math.ceil(m2 * 1.4), unit: 'pza' },
      { name: 'Ángulo perimetral', qty: Math.ceil(((largo * 2) + (ancho * 2)) / 3.05), unit: 'pza' },
      { name: 'Alambre galvanizado cal 12.5', qty: Math.ceil(m2 / 20), unit: 'rollo' },
    ];
  },

  pintura: (m2, manos = 2) => {
    const rendimiento = 10;
    const litros = m2 * manos / rendimiento;
    return [
      { name: 'Pintura vinílica', qty: Math.ceil(litros / 19), unit: 'cubeta 19L' },
      { name: 'Rodillo 9"', qty: Math.ceil(m2 / 100), unit: 'pza' },
      { name: 'Brocha 4"', qty: 1, unit: 'pza' },
      { name: 'Cinta masking', qty: Math.ceil(m2 / 50), unit: 'rollo' },
      { name: 'Lija para pared', qty: Math.ceil(m2 / 20), unit: 'pza' },
    ];
  },

  impermeabilizante: (m2, manos = 2) => {
    const rendimiento = 4;
    const litros = m2 * manos / rendimiento;
    const cubetas19 = Math.ceil(litros / 19);
    return [
      { name: 'Impermeabilizante', qty: cubetas19, unit: 'cubeta 19L' },
      { name: 'Sellador acrílico', qty: Math.ceil(m2 / 6 / 19), unit: 'cubeta 19L' },
      { name: 'Malla de refuerzo', qty: Math.ceil(m2 * 1.1), unit: 'm' },
      { name: 'Escoba o cepillo', qty: 1, unit: 'pza' },
    ];
  },

  rejacero: (metros, alturaIdx) => {
    // alturaIdx: 1=1.00m, 1.5=1.50m, 2=2.00m, 2.5=2.50m
    const altura = alturaIdx;
    const rejas = Math.ceil(metros / 2.50);
    const postes = rejas + 1;
    // Abrazaderas per post based on height
    let abrPerPost = 2;
    if (altura >= 2.50) abrPerPost = 5;
    else if (altura >= 2.00) abrPerPost = 4;
    else if (altura >= 1.50) abrPerPost = 3;
    const abrazaderas = postes * abrPerPost;
    // Poste height is 0.50m taller than reja
    const alturaPosteMap = { 1: '1.50', 1.5: '2.00', 2: '2.50', 2.5: '3.10' };
    const alturaPoste = alturaPosteMap[altura] || (altura + 0.5).toFixed(2);
    const alturaStr = String(altura).replace(/\.?0+$/, '');
    return [
      { name: `Reja ciclónica ${alturaStr}m × 2.50m`, qty: rejas, unit: 'pza' },
      { name: `Poste ${alturaPoste}m para rejacero`, qty: postes, unit: 'pza' },
      { name: 'Abrazadera para rejacero', qty: abrazaderas, unit: 'pza' },
    ];
  },
};

// Main Calculator Component
const Calculadoras = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState(null);

  const categories = {
    construccion: {
      label: '🏗️ Construcción Ligera',
      description: 'Calcula materiales para muros y plafones',
      subcategories: {
        muroTablaroca: { label: 'Muro Tablaroca', fields: ['alto', 'largo'] },
        muroDurock: { label: 'Muro Durock', fields: ['alto', 'largo'] },
        plafonTablaroca: { label: 'Plafón Tablaroca', fields: ['largo', 'ancho'] },
        plafonReticulado: { label: 'Plafón Reticulado', fields: ['largo', 'ancho'] },
      },
    },
    pintura: {
      label: '🎨 Pintura',
      description: 'Calcula pintura y accesorios necesarios',
      directCalc: 'pintura',
      subcategories: {
        pintura: { label: 'Pintura Vinílica', fields: ['m2', 'manos'] },
      },
    },
    impermeabilizante: {
      label: '🛡️ Impermeabilizantes',
      description: 'Calcula materiales impermeabilizantes',
      directCalc: 'impermeabilizante',
      subcategories: {
        impermeabilizante: { label: 'Impermeabilizante', fields: ['m2', 'manos'] },
      },
    },
    rejacero: {
      label: '🔩 Rejacero',
      description: 'Calcula reja ciclónica, postes y abrazaderas',
      directCalc: 'rejacero',
      subcategories: {
        rejacero: { label: 'Reja ciclónica', fields: ['metrosReja', 'alturaReja'] },
      },
    },
  };

  const handleInputChange = (field, value) => {
    setInputs({ ...inputs, [field]: parseFloat(value) || '' });
  };

  const handleCalculate = () => {
    if (!activeSubcategory) return;

    const currentSubcategory = categories[activeCategory].subcategories[activeSubcategory];
    const requiredFields = currentSubcategory.fields;

    // Check if all fields are filled
    if (!requiredFields.every(field => inputs[field] !== '' && inputs[field] !== undefined)) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Get the calculator function
    const calculatorFunc = calculatorFunctions[activeSubcategory];
    if (!calculatorFunc) return;

    // Call the calculator with the appropriate arguments
    const args = requiredFields.map(field => inputs[field]);
    const materialsList = calculatorFunc(...args);

    setResults(materialsList);
  };

  const generateWhatsAppMessage = () => {
    if (!results) return '';

    let message = `Hola, quiero cotizar los siguientes materiales:\n\n`;
    results.forEach(item => {
      message += `- ${item.name}: ${item.qty} ${item.unit}\n`;
    });
    message += `\n¿Cuál es el costo total y tiempo de entrega?`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/5218342472640?text=${message}`, '_blank');
  };

  const handleRegistroClick = () => {
    navigate('/registro');
  };

  const renderInputFields = () => {
    if (!activeSubcategory) return null;

    const currentSubcategory = categories[activeCategory].subcategories[activeSubcategory];
    const fields = currentSubcategory.fields;

    const fieldLabels = {
      alto: { label: 'Alto (metros)', placeholder: 'Ej: 3.05' },
      largo: { label: 'Largo (metros)', placeholder: 'Ej: 5' },
      ancho: { label: 'Ancho (metros)', placeholder: 'Ej: 4' },
      m2: { label: 'Área total (m²)', placeholder: 'Ej: 100' },
      manos: { label: 'Número de manos', placeholder: '1-3 (default 2)', min: 1, max: 3 },
      metrosReja: { label: 'Metros lineales de reja', placeholder: 'Ej: 25' },
      alturaReja: { label: 'Altura de la reja', type: 'select', options: [
        { value: 1, label: '1.00 m' },
        { value: 1.5, label: '1.50 m' },
        { value: 2, label: '2.00 m' },
        { value: 2.5, label: '2.50 m' },
      ]},
    };

    return (
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldLabels[field]?.label}
            </label>
            {fieldLabels[field]?.type === 'select' ? (
              <select
                value={inputs[field] !== undefined ? inputs[field] : ''}
                onChange={e => handleInputChange(field, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="">Selecciona...</option>
                {fieldLabels[field].options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                placeholder={fieldLabels[field]?.placeholder}
                value={inputs[field] !== undefined && inputs[field] !== '' ? inputs[field] : ''}
                onChange={e => handleInputChange(field, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min={fieldLabels[field]?.min}
                max={fieldLabels[field]?.max}
                step="0.01"
              />
            )}
          </div>
        ))}
        <Button
          onClick={handleCalculate}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Calcular
        </Button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Calculadora de Materiales de Construcción | CotizaExpress</title>
        <meta
          name="description"
          content="Calcula los materiales que necesitas para tu proyecto de construcción. Tablaroca, pintura, impermeabilizantes, acero y más."
        />
        <meta
          name="keywords"
          content="calculadora de materiales, calcular tablaroca, calcular pintura, calculadora construcción, materiales construcción"
        />
        <meta property="og:title" content="Calculadora de Materiales de Construcción | CotizaExpress" />
        <meta property="og:description" content="Calcula los materiales que necesitas para tu proyecto" />
        <meta property="og:type" content="website" />
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-14 w-auto" />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-slate-900">CotizaBot</span>
                <span className="text-xs text-slate-500 block -mt-1">by CotizaExpress.com</span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/precios" className="text-slate-600 hover:text-emerald-600 font-medium hidden sm:block">Precios</Link>
              <Link to="/ferreterias" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Ferreterías</Link>
              <Link to="/calculadoras" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Calculadoras</Link>
              <Link to="/demo" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Demo</Link>
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600">Iniciar Sesión</Button>
              </Link>
              <Link to="/registro">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Calculadoras de Construcción
            </h1>
            <p className="text-xl text-emerald-50">
              Calcula los materiales que necesitas para tu proyecto
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-6xl mx-auto py-16 px-4">
          {!activeCategory ? (
            // Category Selection
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(categories).map(([key, category]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setActiveCategory(key);
                    // If category has directCalc, skip subcategory selection
                    if (category.directCalc) {
                      setActiveSubcategory(category.directCalc);
                      // Set default manos=2 for pintura/impermeabilizante
                      if (category.directCalc === 'pintura' || category.directCalc === 'impermeabilizante') {
                        setInputs({ manos: 2 });
                      } else {
                        setInputs({});
                      }
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl">{category.label}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Seleccionar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Subcategory and Calculator View
            <div className="space-y-8">
              {/* Breadcrumb / Back Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCategory(null);
                  setActiveSubcategory(null);
                  setInputs({});
                  setResults(null);
                }}
                className="mb-4"
              >
                ← Volver a categorías
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {categories[activeCategory].label}
                  </CardTitle>
                  <CardDescription>
                    {categories[activeCategory].description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {!activeSubcategory ? (
                    // Subcategory Selection
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(categories[activeCategory].subcategories).map(
                        ([key, subcategory]) => (
                          <Button
                            key={key}
                            onClick={() => {
                              setActiveSubcategory(key);
                              setInputs({});
                              setResults(null);
                            }}
                            variant="outline"
                            className="h-auto p-4 justify-start"
                          >
                            <span className="text-left">{subcategory.label}</span>
                          </Button>
                        )
                      )}
                    </div>
                  ) : (
                    // Calculator Form and Results
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Input Section */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-gray-900">
                          {categories[activeCategory].subcategories[activeSubcategory].label}
                        </h3>
                        {renderInputFields()}
                        {!categories[activeCategory].directCalc && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveSubcategory(null);
                              setInputs({});
                              setResults(null);
                            }}
                            className="w-full mt-4"
                          >
                            Cambiar tipo
                          </Button>
                        )}
                      </div>

                      {/* Results Section */}
                      {results && (
                        <div>
                          <h3 className="text-xl font-semibold mb-6 text-gray-900">
                            Materiales Necesarios
                          </h3>
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-emerald-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    Material
                                  </th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                    Cantidad
                                  </th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                    Unidad
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {results.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.name}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600">
                                      {item.qty}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                                      {item.unit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA Section */}
              {results && (
                <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="pt-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        ¿Listo para tu proyecto?
                      </h3>
                      <p className="text-gray-700">
                        Conecta con ferreterías locales para obtener cotizaciones de los materiales que necesitas.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={handleWhatsAppClick}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          📱 Cotizar por WhatsApp
                        </Button>
                        <Button
                          onClick={handleRegistroClick}
                          variant="outline"
                          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                        >
                          🏪 ¿Eres ferretería?
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="bg-white py-16 px-4 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Cómo funciona
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">1️⃣</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Elige tu proyecto</h3>
                  <p className="text-gray-600">
                    Selecciona el tipo de material o construcción que necesitas calcular.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">2️⃣</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingresa medidas</h3>
                  <p className="text-gray-600">
                    Proporciona las dimensiones de tu proyecto en metros.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">3️⃣</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Obtén cotizaciones</h3>
                  <p className="text-gray-600">
                    Conecta con ferreterías para obtener precios y disponibilidad.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA para ferreterías */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Eres ferretería o distribuidora?</h2>
            <p className="text-lg text-emerald-50 mb-8 max-w-2xl mx-auto">
              Automatiza cotizaciones por WhatsApp con IA. Tus clientes preguntan precio y reciben cotización con IVA en 3 segundos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/registro">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6">
                  Comenzar Gratis
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Planes y Precios */}
        <section className="py-20 bg-white" id="planes">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">Planes y Precios</h2>
            <p className="text-center text-slate-600 mb-12">Elige el plan que mejor se adapte a tu negocio</p>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-slate-200">
                <CardContent className="pt-8 pb-8 text-center">
                  <h3 className="text-2xl font-bold mb-2">Plan Completo</h3>
                  <div className="text-5xl font-bold text-slate-700 mb-2">$1,000</div>
                  <p className="text-slate-500 mb-6">MXN/mes + IVA</p>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Cotizaciones ilimitadas</li>
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>WhatsApp Business integrado</li>
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Dashboard completo</li>
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Soporte prioritario</li>
                  </ul>
                  <Link to="/registro"><Button variant="outline" className="w-full" size="lg">Comenzar</Button></Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-sm font-medium">Recomendado</div>
                <CardContent className="pt-8 pb-8 text-center">
                  <h3 className="text-2xl font-bold mb-2">Plan Pro</h3>
                  <div className="text-5xl font-bold text-emerald-600 mb-2">$2,000</div>
                  <p className="text-slate-500 mb-6">MXN/mes + IVA</p>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Todo del Plan Completo</li>
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg><strong>Cobra por WhatsApp</strong></li>
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Mercado Pago y SPEI</li>
                    <li className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Notificaciones de pago</li>
                  </ul>
                  <Link to="/registro"><Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">Empezar con Pro</Button></Link>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-slate-500 mt-6"><Link to="/precios" className="text-emerald-600 hover:underline">Ver todos los planes y comparativa completa →</Link></p>
          </div>
        </section>
      </main>

      {/* Footer (matches LandingPage) */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-14 w-auto brightness-0 invert"/>
                <div>
                  <span className="text-lg font-bold text-white">CotizaBot</span>
                  <span className="text-xs text-slate-400 block">by CotizaExpress.com</span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm max-w-md">Sistema de IA para automatizar cotizaciones y ventas por WhatsApp. Diseñado para PYMEs mexicanas.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/precios" className="text-slate-400 hover:text-white">Precios</Link></li>
                <li><Link to="/demo" className="text-slate-400 hover:text-white">Demo</Link></li>
                <li><Link to="/ferreterias" className="text-slate-400 hover:text-white">Para Ferreterías</Link></li>
                <li><Link to="/refaccionarias" className="text-slate-400 hover:text-white">Para Refaccionarias</Link></li>
                <li><Link to="/calculadoras" className="text-slate-400 hover:text-white">Calculadoras</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacidad" className="text-slate-400 hover:text-white">Aviso de Privacidad</Link></li>
                <li><Link to="/terminos" className="text-slate-400 hover:text-white">Términos y Condiciones</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} CotizaExpress.com - CotizaBot. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </>
  );
};

export default Calculadoras;
