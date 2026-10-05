import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Wand2, Trash2, Plus, Copy, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com';
const API = `${BACKEND_URL}/api`;

export default function Cotizador() {
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [items, setItems] = useState([]);
  const [dudas, setDudas] = useState([]);
  const [noEnc, setNoEnc] = useState([]);
  const [cliente, setCliente] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null); // {folio, total, link}
  const [ivaPct, setIvaPct] = useState(16);
  const [ivaIncluido, setIvaIncluido] = useState(true);
  const [region, setRegion] = useState(() => localStorage.getItem('cotizador_region') || 'MX');
  const cambiarRegion = (r) => {
    setRegion(r);
    localStorage.setItem('cotizador_region', r);
    if (r === 'US') { setIvaPct(8); setIvaIncluido(false); }
    else { setIvaPct(16); setIvaIncluido(true); }
  };
  const esUS = region === 'US';
  const etiquetaImpuesto = esUS ? 'Tax' : 'IVA';
  const [buscado, setBuscado] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [catalogoVacio, setCatalogoVacio] = useState(false);
  const resultRef = useRef(null);
  const [installEvt, setInstallEvt] = useState(null);
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  useEffect(() => {
    if (resultado || paywall) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [resultado, paywall]);

  const cotizarIA = async () => {
    if (!texto.trim()) { toast.error('Pega la lista del cliente'); return; }
    setCargando(true); setResultado(null);
    try {
      const r = await axios.post(`${API}/cotizador/ia`, { texto }, { withCredentials: true });
      setCatalogoVacio(!!r.data.catalogo_vacio);
      setItems(r.data.encontrados || []);
      setDudas(r.data.dudas || []);
      setNoEnc(r.data.no_encontrados || []);
      setBuscado(true);
      if ((r.data.encontrados || []).length === 0 && (r.data.dudas || []).length === 0) {
        setItems([{ name: '', qty: 1, unit: 'pza', price: '', tipo: 'material' }]);
        toast.info('No los encontré en tu catálogo — puedes escribirlos a mano aquí abajo.');
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Error al cotizar');
    } finally { setCargando(false); }
  };

  const elegirCandidato = (duda, cand) => {
    setItems(prev => [...prev, { name: cand.name, qty: duda.qty, unit: cand.unit, price: cand.price, sku: cand.sku }]);
    setDudas(prev => prev.filter(d => d !== duda));
  };

  const setItem = (i, campo, valor) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [campo]: valor } : it));
  };

  const agregarRenglon = (tipo = 'material') => setItems(prev => [...prev, {
    name: '', qty: 1,
    unit: tipo === 'mano_obra' ? 'servicio' : 'pza',
    price: '', tipo,
  }]);
  const toggleTipo = (i) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, tipo: it.tipo === 'mano_obra' ? 'material' : 'mano_obra' } : it));
  const quitarRenglon = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const suma = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0);
  const pct = Math.max(0, parseFloat(ivaPct) || 0) / 100;
  // Si los precios ya incluyen IVA: total = suma y el IVA se desglosa hacia atrás.
  const subtotal = ivaIncluido ? suma / (1 + pct) : suma;
  const iva = subtotal * pct;
  const total = subtotal + iva;

  const guardar = async () => {
    setGuardando(true);
    try {
      const itemsPdf = items.map(it => it.tipo === 'mano_obra' && !/mano de obra/i.test(it.name)
        ? { ...it, name: `Mano de obra — ${it.name}` } : it);
      const r = await axios.post(`${API}/cotizador/guardar`, { items: itemsPdf, cliente, vat_pct: parseFloat(ivaPct) || 0, vat_incluido: ivaIncluido, moneda: esUS ? 'USD' : 'MXN' }, { withCredentials: true });
      setResultado(r.data);
      toast.success(`Cotización ${r.data.folio} creada`);
    } catch (e) {
      if (e?.response?.status === 402) {
        setPaywall(true);
      } else {
        toast.error(e?.response?.data?.detail || 'Error al guardar');
      }
    } finally { setGuardando(false); }
  };

  const msgTexto = resultado
    ? `Hola${cliente ? ' ' + cliente : ''}, aquí está tu cotización ${resultado.folio} por $${resultado.total.toLocaleString('es-MX', {minimumFractionDigits: 2})}${resultado.moneda === 'USD' ? ' USD' : ''}: ${resultado.link}`
    : '';
  const msgWhats = encodeURIComponent(msgTexto);
  const msgMail = resultado
    ? `mailto:?subject=${encodeURIComponent('Cotización ' + resultado.folio)}&body=${encodeURIComponent(msgTexto)}`
    : '#';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cotizador IA</h2>
          <p className="text-slate-600 text-sm">Pega la lista de tu cliente tal como te la mandó — la IA la convierte en cotización con tu catálogo.</p>
          <p className="text-xs text-violet-700 mt-1 font-medium">Plan Cotizador IA: cotizaciones ilimitadas por $299/mes · <a href="/precios" className="underline">ver planes</a></p>

        </div>
      </div>

      {/* Paso 1: pegar lista */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <label className="text-sm font-medium text-slate-700">Lista del cliente (como te la haya mandado)</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder={'Ej:\n10 cemento gris\n5 varilla 3/8\n200 block'}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          />
          <Button onClick={cotizarIA} disabled={cargando} className="bg-violet-600 hover:bg-violet-700">
            {cargando ? 'Buscando en tu catálogo...' : '✨ Cotizar con IA'}
          </Button>
        </CardContent>
      </Card>

      {/* Dudas: elegir candidato */}
      {dudas.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm font-semibold text-amber-900">Encontré varias opciones — elige la correcta:</p>
            {dudas.map((d, i) => (
              <div key={i}>
                <p className="text-sm text-slate-700 mb-2"><strong>{d.qty}x {d.raw}</strong> — ¿cuál es?</p>
                <div className="flex flex-wrap gap-2">
                  {d.candidates.map((c, j) => (
                    <button key={j} onClick={() => elegirCandidato(d, c)}
                      className="text-sm bg-white border border-amber-300 hover:bg-amber-100 rounded-lg px-3 py-1.5">
                      {c.name} — ${Number(c.price).toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {catalogoVacio && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-900 flex flex-wrap items-center justify-between gap-3">
          <span>📦 <strong>Tu catálogo está vacío</strong> — la IA busca en TUS productos con TUS precios. Agrégalos primero (o escribe los renglones a mano abajo).</span>
          <a href="/carga-productos"><Button size="sm" className="bg-blue-600 hover:bg-blue-700">Subir mi catálogo</Button></a>
        </div>
      )}

      {noEnc.length > 0 && noEnc[0] && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          🔎 No encontré <strong>{noEnc.join(', ')}</strong> en tu catálogo.
          Escríbelos a mano en la tabla de abajo (con su precio), o
          <a href="/productos" className="underline font-medium ml-1">agrégalos a tu catálogo</a> para que la IA los encuentre la próxima vez.
        </div>
      )}

      {/* Paso 2: tabla editable */}
      {(items.length > 0 || dudas.length > 0 || buscado) && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
              <span className="col-span-5">Producto</span><span className="col-span-2">Cantidad</span>
              <span className="col-span-2">Unidad</span><span className="col-span-2">Precio</span><span></span>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <button
                  type="button"
                  onClick={() => toggleTipo(i)}
                  title="Cambiar entre material y mano de obra"
                  className={`col-span-12 sm:col-span-2 text-[11px] font-bold rounded-full px-2 py-1.5 border ${it.tipo === 'mano_obra' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  {it.tipo === 'mano_obra' ? '👷 M. de obra' : '📦 Material'}
                </button>
                <input className="col-span-12 sm:col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder={it.tipo === 'mano_obra' ? 'Ej: Instalación completa' : 'Producto'} value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" type="number" min="1" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" type="number" step="0.01" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} />
                <button onClick={() => quitarRenglon(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => agregarRenglon('material')} className="text-sm text-violet-700 flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5 hover:bg-violet-100"><Plus className="w-4 h-4" /> Material</button>
              <button onClick={() => agregarRenglon('mano_obra')} className="text-sm text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-100"><Plus className="w-4 h-4" /> 👷 Mano de obra</button>
            </div>

            <div className="border-t pt-3 text-sm text-slate-700 space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-end text-xs text-slate-600">
                <div className="flex rounded-full border border-slate-200 overflow-hidden mr-2">
                  <button type="button" onClick={() => cambiarRegion('MX')} className={`px-3 py-1 text-xs font-bold ${!esUS ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500'}`}>🇲🇽 MXN</button>
                  <button type="button" onClick={() => cambiarRegion('US')} className={`px-3 py-1 text-xs font-bold ${esUS ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>🇺🇸 USD</button>
                </div>
                <label className="flex items-center gap-1">
                  {etiquetaImpuesto}
                  <input
                    type="number" min="0" max="30" step="0.5"
                    value={ivaPct}
                    onChange={(e) => setIvaPct(e.target.value)}
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-right"
                  />%
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={ivaIncluido} onChange={() => setIvaIncluido(true)} />
                  Mis precios ya lo incluyen
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={!ivaIncluido} onChange={() => setIvaIncluido(false)} />
                  Agregarlo al total
                </label>
              </div>
              {items.some(it => it.tipo === 'mano_obra') && items.some(it => it.tipo !== 'mano_obra') && (
                <>
                  <div className="flex justify-end gap-8 text-slate-500"><span>📦 Materiales:</span><span className="w-28 text-right">${items.filter(it => it.tipo !== 'mano_obra').reduce((t, it) => t + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
                  <div className="flex justify-end gap-8 text-slate-500"><span>👷 Mano de obra:</span><span className="w-28 text-right">${items.filter(it => it.tipo === 'mano_obra').reduce((t, it) => t + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
                </>
              )}
              <div className="flex justify-end gap-8"><span>Subtotal:</span><span className="w-28 text-right">${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-end gap-8"><span>{etiquetaImpuesto} {ivaPct || 0}%:</span><span className="w-28 text-right">${iva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-end gap-8 font-bold text-slate-900"><span>TOTAL:</span><span className="w-28 text-right">${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
            </div>

            <div className="flex flex-wrap gap-3 items-center pt-2">
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente (opcional)"
                className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <Button onClick={guardar} disabled={guardando || items.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                {guardando ? 'Generando...' : 'Generar cotización (folio + PDF)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instalar como app — explicado for dummies */}
      <div className="bg-slate-900 text-white rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">📲 Ten CotizaBot como app en tu celular</p>
            <p className="text-sm text-slate-300 mt-0.5">Con su propio ícono, junto a tu WhatsApp. Sin tiendas, sin descargas raras — gratis.</p>
          </div>
          {installEvt ? (
            <button
              onClick={async () => { installEvt.prompt(); setInstallEvt(null); }}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full px-5 py-2.5"
            >
              Instalar ahora (1 toque)
            </button>
          ) : (
            <details className="text-sm">
              <summary className="cursor-pointer bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 font-medium">¿Cómo le hago? 👆</summary>
              <div className="mt-3 space-y-3 bg-white/5 rounded-xl p-4 max-w-md">
                <div>
                  <p className="font-bold text-emerald-300">Si tu celular es Android (Samsung, Motorola, Xiaomi...):</p>
                  <p className="text-slate-300">1. Abre esta página en <strong>Chrome</strong> desde tu celular.<br/>2. Toca los <strong>3 puntitos</strong> de arriba a la derecha ⋮<br/>3. Toca <strong>"Agregar a pantalla principal"</strong> (o "Instalar app").<br/>4. Listo: busca el ícono 🤖 junto a tus demás apps.</p>
                </div>
                <div>
                  <p className="font-bold text-emerald-300">Si es iPhone:</p>
                  <p className="text-slate-300">1. Abre esta página en <strong>Safari</strong> desde tu iPhone.<br/>2. Toca el botón de <strong>compartir</strong> (el cuadrito con flecha ↑, abajo en medio).<br/>3. Desliza y toca <strong>"Agregar a pantalla de inicio"</strong>.<br/>4. Toca <strong>Agregar</strong> — y ya tienes tu app.</p>
                </div>
                <p className="text-xs text-slate-400">Tip: mándate este link por WhatsApp para abrirlo en el celular: cotizaexpress.com/cotizador</p>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Paywall: ¿te gustó? */}
      {paywall && (
        <Card ref={resultRef} className="border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-3xl">🎉</p>
            <p className="text-xl font-bold text-slate-900">¿Te gustó? Esa fue tu cotización gratis del mes.</p>
            <p className="text-slate-600 max-w-md mx-auto">
              Con el <strong>Plan Cotizador IA ($299/mes)</strong> haces cotizaciones ilimitadas
              con tu logo, folio y PDF — y te ahorras horas cada semana.
            </p>
            <a href="/precios">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">Activar mi plan — $299/mes</Button>
            </a>
            <p className="text-xs text-slate-400">Se activa en 1 minuto con tarjeta o SPEI · factura disponible</p>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: resultado */}
      {resultado && (
        <Card ref={resultRef} className="border-emerald-300 bg-emerald-50/50">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-lg font-bold text-slate-900">✅ Cotización <span className="text-emerald-700">{resultado.folio}</span> — ${resultado.total.toLocaleString('es-MX', {minimumFractionDigits: 2})} + IVA</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={`https://wa.me/?text=${msgWhats}`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#25D366] hover:bg-[#1ebe57]">📲 Enviar por WhatsApp</Button>
              </a>
              <a href={msgMail}>
                <Button variant="outline">✉️ Enviar por correo</Button>
              </a>
              <a href={`${resultado.link}?download=1`}>
                <Button variant="outline"><FileText className="w-4 h-4 mr-2" />Descargar PDF</Button>
              </a>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(resultado.link); toast.success('Link copiado'); }}>
                <Copy className="w-4 h-4 mr-2" />Copiar link
              </Button>
            </div>
            <div className="bg-white border border-violet-200 rounded-lg px-4 py-3 text-sm text-slate-700 max-w-lg mx-auto">
              ✨ Esto es el <strong>Plan Cotizador IA — $299/mes</strong>: cotizaciones ilimitadas con tu logo y folio.
              <a href="/precios" className="text-violet-700 underline font-medium ml-1">Activar mi plan</a>
            </div>
            <p className="text-xs text-slate-500">🤖 ¿Y si se contestara solo cuando el cliente te escribe? Eso hace CotizaBot ($1,000/mes) al conectar tu WhatsApp.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
