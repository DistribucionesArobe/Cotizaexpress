import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// ── Chat Demo Widget ────────────────────────────────────────────────
const DEMO_MESSAGES = [
  { from: 'client', text: 'Hola, precio de 10 tablaroca ultralight y 5 bultos de redimix', delay: 0 },
  { from: 'bot', text: '...', typing: true, delay: 800 },
  { from: 'bot', text: '✅ 2 producto(s) cotizados.\nCotización:\n\n• 10 x Tablaroca ultralight USG — $2,450\n• 5 x Redimix 28 kg USG — $3,300\n\nTotal: $5,750 (IVA incluido)\n📋 Folio: CX-7KM2PN\n💳 Escribe *pagar* y te mandamos datos bancarios o link para pago con tarjeta.', delay: 2400 },
  { from: 'client', text: 'Agrega 100 pijas 6x1', delay: 5500 },
  { from: 'bot', text: '...', typing: true, delay: 6300 },
  { from: 'bot', text: '✅ 3 producto(s) cotizados.\nCotización:\n\n• 10 x Tablaroca ultralight USG — $2,450\n• 5 x Redimix 28 kg USG — $3,300\n• 100 x Pija 6 x 1 — $28\n\nTotal: $5,778 (IVA incluido)\n📋 Folio: CX-7KM2PN\n💳 Escribe *pagar* y te mandamos datos bancarios o link para pago con tarjeta.', delay: 8200 },
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
            <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer"
               className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white text-center py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Pruebalo en WhatsApp ahora
            </a>
            <button onClick={replay} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Repetir demo</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
          open ? 'bg-slate-600 hover:bg-slate-700' : 'bg-[#25D366] hover:bg-[#1ebe57]'
        }`}
        style={!open ? { animation: 'float-pulse 3s ease-in-out infinite' } : {}}>
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
        )}
        <span className="font-semibold text-sm whitespace-nowrap">{open ? 'Cerrar' : 'Prueba el bot'}</span>
      </button>
      <style>{`
        @keyframes float-pulse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}

// ── Inline Chat Preview (static, for hero section) ──────────────────
function InlineChatPreview() {
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-white">
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">CB</div>
        <div>
          <p className="font-semibold text-sm leading-tight">Tu Ferretería</p>
          <p className="text-[11px] text-emerald-200">En linea</p>
        </div>
      </div>
      <div className="px-3 py-3 space-y-2" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M0 20h40M20 0v40\' stroke=\'%23e8e5de\' stroke-width=\'.5\' fill=\'none\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'200\' height=\'200\' fill=\'%23ECE5DD\'/%3E%3Crect width=\'200\' height=\'200\' fill=\'url(%23p)\'/%3E%3C/svg%3E")' }}>
        <div className="flex justify-end">
          <div className="max-w-[80%] px-3 py-2 rounded-lg rounded-tr-none bg-[#DCF8C6] text-slate-800 text-[13px] shadow-sm">
            Precio de 5 cubetas de impermeabilizante
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] px-3 py-2 rounded-lg rounded-tl-none bg-white text-slate-800 text-[13px] shadow-sm whitespace-pre-line">
            <span dangerouslySetInnerHTML={{ __html: '✅ Cotización:<br/><br/>• 5 x Impermeabilizante 19L — $8,750<br/><br/>Total: <b>$10,150</b> (IVA incluido)<br/>📋 Folio: CX-3FK9A2' }} />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] px-3 py-2 rounded-lg rounded-tr-none bg-[#DCF8C6] text-slate-800 text-[13px] shadow-sm">
            pagar
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] px-3 py-2 rounded-lg rounded-tl-none bg-white text-slate-800 text-[13px] shadow-sm whitespace-pre-line">
            <span dangerouslySetInnerHTML={{ __html: '💳 Datos para pago:<br/>SPEI: 012180001234567890<br/>Mercado Pago: <b>link.mercadopago.com/tu-ferre</b>' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Check icon helper ───────────────────────────────────────────────
const Check = () => (
  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
  </svg>
);

// ── Main Page ───────────────────────────────────────────────────────
export default function FerreteriasSEO() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>CotizaBot para Ferreterías - Cotizaciones Automáticas por WhatsApp | CotizaExpress</title>
        <meta name="description" content="Software de cotizaciones automáticas por WhatsApp para ferreterías en México. Responde precios con IVA en 3 segundos. Desde $1,000 MXN/mes. Prueba gratis." />
        <link rel="canonical" href="https://cotizaexpress.com/ferreterias" />
        <meta property="og:title" content="CotizaBot para Ferreterías - Cotiza por WhatsApp con IA" />
        <meta property="og:description" content="Tu cliente pregunta precio por WhatsApp, CotizaBot responde en 3 segundos con IVA incluido. 24/7." />
        <meta property="og:url" content="https://cotizaexpress.com/ferreterias" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Nav */}
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
              <Link to="/ferreterias" className="text-emerald-600 font-medium hidden md:block">Ferreterías</Link>
              <Link to="/calculadoras" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Calculadoras</Link>
              <Link to="/demo" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Demo</Link>
              <Link to="/login"><Button variant="ghost" className="text-slate-600">Iniciar Sesión</Button></Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Diseñado para ferreterías mexicanas
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  Tu cliente pregunta precio.<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Cotiza en 3 segundos.</span>
                </h1>
                <p className="text-lg text-slate-600 mb-4">
                  CotizaBot responde por WhatsApp con precios, IVA y cotización profesional. Tornillería, herramientas, pinturas, impermeabilizantes — todo tu catálogo.
                </p>
                <p className="text-base text-slate-500 mb-8">
                  Sin empleado contestando. Sin errores de cálculo. 24/7 incluyendo domingos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-[#25D366] hover:bg-[#1ebe57] text-lg px-8 py-6 w-full sm:w-auto">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Probar Demo Gratis
                    </Button>
                  </a>
                  <Link to="/registro">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">Crear Cuenta</Button>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
                  <div className="flex items-center gap-2"><Check /><span className="text-sm text-slate-600">Sin verificar WhatsApp</span></div>
                  <div className="flex items-center gap-2"><Check /><span className="text-sm text-slate-600">IVA al 16% incluido</span></div>
                  <div className="flex items-center gap-2"><Check /><span className="text-sm text-slate-600">Desde $1,000/mes</span></div>
                </div>
              </div>
              <div className="hidden lg:block">
                <InlineChatPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Problema / Solución */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">El problema de toda ferretería</h2>
            <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">
              Tus clientes mandan WhatsApp pidiendo precios. Tú o tu empleado buscan en el sistema, calculan IVA, arman la cotización... y a veces el cliente ya se fue.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 border-red-100 bg-red-50/30">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-3">😤</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Clientes que no esperan</h3>
                  <p className="text-slate-600">Si tardas más de 5 minutos en responder, tu cliente ya le mandó mensaje a otra ferretería. Pierdes la venta.</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-100 bg-red-50/30">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-3">🧮</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Errores de cálculo</h3>
                  <p className="text-slate-600">Cotizar mal el IVA, equivocarse en precios, olvidar productos. Un error te puede costar la ganancia de toda la venta.</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-100 bg-red-50/30">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-3">🌙</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Fuera de horario</h3>
                  <p className="text-slate-600">Los contratistas planean sus compras por la noche o el domingo. Si no contestas, compran en otro lado el lunes.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">Cómo funciona CotizaBot</h2>
            <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">En 3 pasos tu ferretería cotiza sola</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">1</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sube tu catálogo</h3>
                <p className="text-slate-600">Carga tus productos desde Excel o agrégalos manualmente. Precios, unidades y SKU.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Comparte tu link</h3>
                <p className="text-slate-600">Dale a tus clientes tu número de WhatsApp. CotizaBot responde automáticamente.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">3</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cobra y entrega</h3>
                <p className="text-slate-600">El bot genera la cotización con IVA y manda link de pago. Tú solo preparas el pedido.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios con números */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-16">Lo que CotizaBot hace por tu ferretería</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">3 seg</div>
                <p className="text-slate-600">Tiempo de respuesta promedio. Tu cliente recibe precio al instante.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">24/7</div>
                <p className="text-slate-600">Cotiza domingos, noches y días festivos. Nunca pierdas una venta.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">0 errores</div>
                <p className="text-slate-600">IVA al 16% calculado automáticamente. Sin errores humanos.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">+10,000</div>
                <p className="text-slate-600">Productos en catálogo. Tornillería, herramientas, pinturas, plomería y más.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Productos */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Funciona con todo tu inventario</h2>
            <p className="text-center text-slate-600 mb-12">CotizaBot entiende cómo buscan tus clientes</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { cat: 'Tornillería', ex: '"100 pijas 6x1"' },
                { cat: 'Herramientas', ex: '"taladro inalámbrico"' },
                { cat: 'Pinturas', ex: '"5 cubetas vinílica blanca"' },
                { cat: 'Impermeabilizantes', ex: '"3 cubetas fibratado"' },
                { cat: 'Plomería', ex: '"tubo cpvc 1/2"' },
                { cat: 'Material eléctrico', ex: '"100m cable calibre 12"' },
                { cat: 'Construcción ligera', ex: '"20 tablaroca ultralight"' },
                { cat: 'Y mucho más...', ex: 'Tu catálogo completo' },
              ].map((item, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-4">
                    <h3 className="font-bold text-slate-900 mb-1">{item.cat}</h3>
                    <p className="text-sm text-slate-500 italic">{item.ex}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Calculadoras */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Calculadoras de materiales incluidas</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Tu cliente dice "necesito un muro de tablaroca de 3x5" y CotizaBot calcula automáticamente todos los materiales: tablaroca, perfiles, pijas, pasta, cinta. Con precio.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-lg p-4"><span className="font-bold text-emerald-700">Construcción ligera</span><br/><span className="text-sm text-slate-600">Muros y plafones</span></div>
              <div className="bg-emerald-50 rounded-lg p-4"><span className="font-bold text-emerald-700">Pintura</span><br/><span className="text-sm text-slate-600">Cubetas y accesorios</span></div>
              <div className="bg-emerald-50 rounded-lg p-4"><span className="font-bold text-emerald-700">Impermeabilizante</span><br/><span className="text-sm text-slate-600">Cubetas y malla</span></div>
              <div className="bg-emerald-50 rounded-lg p-4"><span className="font-bold text-emerald-700">Rejacero</span><br/><span className="text-sm text-slate-600">Reja, postes, abrazaderas</span></div>
            </div>
            <Link to="/calculadoras">
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                Probar calculadoras gratis →
              </Button>
            </Link>
          </div>
        </section>

        {/* Planes y Precios */}
        <section className="py-20 bg-slate-50" id="planes">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 mb-4">Planes y Precios</h2>
            <p className="text-center text-slate-600 mb-12">Sin contratos. Cancela cuando quieras.</p>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-slate-200">
                <CardContent className="pt-8 pb-8 text-center">
                  <h3 className="text-2xl font-bold mb-2">Plan Completo</h3>
                  <div className="text-5xl font-bold text-slate-700 mb-2">$1,000</div>
                  <p className="text-slate-500 mb-6">MXN/mes + IVA</p>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center gap-2"><Check />Cotizaciones ilimitadas</li>
                    <li className="flex items-center gap-2"><Check />WhatsApp Business integrado</li>
                    <li className="flex items-center gap-2"><Check />Calculadoras de materiales</li>
                    <li className="flex items-center gap-2"><Check />Dashboard y reportes</li>
                    <li className="flex items-center gap-2"><Check />Soporte prioritario</li>
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
                    <li className="flex items-center gap-2"><Check />Todo del Plan Completo</li>
                    <li className="flex items-center gap-2"><Check /><strong>Cobra por WhatsApp</strong></li>
                    <li className="flex items-center gap-2"><Check />Mercado Pago y SPEI</li>
                    <li className="flex items-center gap-2"><Check />Notificaciones de pago</li>
                    <li className="flex items-center gap-2"><Check />Descuentos por volumen</li>
                  </ul>
                  <Link to="/registro"><Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">Empezar con Pro</Button></Link>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-slate-500 mt-6"><Link to="/precios" className="text-emerald-600 hover:underline">Ver comparativa completa de planes →</Link></p>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Prueba CotizaBot ahora mismo</h2>
            <p className="text-lg text-amber-100 mb-8">Manda un mensaje al demo y ve cómo cotiza en 3 segundos. Sin registro, sin tarjeta.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/5218342472640?text=Hola%20quiero%20precio%20de%2010%20tablaroca" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 text-lg px-8 py-6">
                  Probar Demo por WhatsApp
                </Button>
              </a>
              <Link to="/registro">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
              <p className="text-slate-400 text-sm max-w-md">Sistema de IA para automatizar cotizaciones y ventas por WhatsApp. Diseñado para ferreterías y PYMEs mexicanas.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/precios" className="text-slate-400 hover:text-white">Precios</Link></li>
                <li><Link to="/demo" className="text-slate-400 hover:text-white">Demo</Link></li>
                <li><Link to="/ferreterias" className="text-slate-400 hover:text-white">Para Ferreterías</Link></li>
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
    </div>
  );
}
