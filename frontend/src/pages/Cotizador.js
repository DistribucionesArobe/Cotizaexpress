import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Wand2, Trash2, Plus, Copy, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com';
const API = `${BACKEND_URL}/api`;

export default function Cotizador() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [items, setItems] = useState([
    { name: '', qty: 1, unit: 'pza', price: '', tipo: 'material' },
    { name: '', qty: 1, unit: 'pza', price: '', tipo: 'material' },
    { name: '', qty: 1, unit: 'pza', price: '', tipo: 'material' },
  ]);
  const [dudas, setDudas] = useState([]);
  const [noEnc, setNoEnc] = useState([]);
  const [cliente, setCliente] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null); // {folio, total, link}
  const [ivaPct, setIvaPct] = useState(16);
  const [ivaIncluido, setIvaIncluido] = useState(true);
  const [region, setRegion] = useState(() => localStorage.getItem('cotizador_region') || 'MX');
  // En USA la mano de obra muchas veces NO lleva sales tax (depende del estado y del tipo de trabajo)
  const [taxLabor, setTaxLabor] = useState(() => (localStorage.getItem('cotizador_region') === 'US' ? localStorage.getItem('cotizador_tax_labor') === '1' : true));
  const cambiarTaxLabor = (v) => { setTaxLabor(v); localStorage.setItem('cotizador_tax_labor', v ? '1' : '0'); };
  const cambiarRegion = (r) => {
    setRegion(r);
    localStorage.setItem('cotizador_region', r);
    if (r === 'US') { setIvaPct(8); setIvaIncluido(false); setTaxLabor(localStorage.getItem('cotizador_tax_labor') === '1'); }
    else { setIvaPct(16); setIvaIncluido(true); setTaxLabor(true); }
  };
  const esUS = region === 'US';
  const [pdfLang, setPdfLang] = useState(() => localStorage.getItem('cotizador_pdf_lang') || 'es');
  const cambiarPdfLang = (l) => { setPdfLang(l); localStorage.setItem('cotizador_pdf_lang', l); };
  const etiquetaImpuesto = esUS ? 'Tax' : 'IVA';
  const TAX_ESTADOS_US = {
    'Texas': 8.2, 'California': 8.85, 'Florida': 7.0, 'Illinois': 8.86, 'Arizona': 8.38,
    'Georgia': 7.4, 'Carolina del Norte': 7.0, 'Nevada': 8.24, 'Colorado': 7.8, 'Washington': 9.4,
    'Nueva York': 8.53, 'Nueva Jersey': 6.63, 'Tennessee': 9.55, 'Oklahoma': 9.0, 'Utah': 7.3,
    'Carolina del Sur': 7.5, 'Indiana': 7.0, 'Nuevo México': 7.6, 'Kansas': 8.65, 'Oregón': 0,
  };
  const [estadoUS, setEstadoUS] = useState(() => localStorage.getItem('cotizador_us_estado') || '');
  const elegirEstadoUS = (nombre) => {
    setEstadoUS(nombre);
    localStorage.setItem('cotizador_us_estado', nombre);
    if (nombre && TAX_ESTADOS_US[nombre] !== undefined) setIvaPct(TAX_ESTADOS_US[nombre]);
  };
  const [modoGanancia, setModoGanancia] = useState(() => localStorage.getItem('cotizador_ganancia') === '1');
  const toggleGanancia = () => {
    const v = !modoGanancia;
    setModoGanancia(v);
    localStorage.setItem('cotizador_ganancia', v ? '1' : '0');
  };
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

  const checarSesion = (e) => {
    if (e && e.response && e.response.status === 401) {
      toast.error('Crea tu cuenta gratis para cotizar (1 minuto)');
      navigate('/registro?next=/cotizador');
      return true;
    }
    return false;
  };

  const cotizarIA = async (textoDirecto) => {
    const t = (typeof textoDirecto === 'string' ? textoDirecto : texto).trim();
    if (!t) { toast.error('Pega la lista del cliente'); return; }
    setCargando(true); setResultado(null);
    try {
      const r = await axios.post(`${API}/cotizador/ia`, { texto: t }, { withCredentials: true });
      setCatalogoVacio(!!r.data.catalogo_vacio);
      const encontrados = r.data.encontrados || [];
      // Los que no están en el catálogo también van a la tabla: solo falta el precio
      const sinPrecio = (r.data.no_encontrados || [])
        .map(x => (x || '').replace(/`/g, '').trim())
        .filter(x => x.length > 1)
        .map(x => {
          const m = x.match(/^(\d+(?:[.,]\d+)?)\s+(.{2,})$/);
          return m
            ? { name: m[2].trim(), qty: m[1], unit: 'pza', price: '', tipo: 'material' }
            : { name: x, qty: 1, unit: 'pza', price: '', tipo: 'material' };
        });
      setItems(prev => [...prev.filter(it => (it.name || '').trim()), ...encontrados, ...sinPrecio]);
      setDudas(r.data.dudas || []);
      setNoEnc(r.data.no_encontrados || []);
      setBuscado(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (sinPrecio.length > 0) {
        toast.info('Listo: ' + sinPrecio.length + ' renglones en la tabla — solo ponles precio.');
      }
    } catch (e) {
      if (!checarSesion(e)) toast.error(e?.response?.data?.detail || 'Error al cotizar');
    } finally { setCargando(false); }
  };

  const [leyendoFoto, setLeyendoFoto] = useState(false);
  const fotoRef = useRef(null);
  const subirFoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setLeyendoFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await axios.post(`${API}/cotizador/imagen`, fd, { withCredentials: true });
      setTexto(r.data.texto);
      toast.success('📷 Leí ' + r.data.renglones + ' renglones de tu foto');
      await cotizarIA(r.data.texto);
    } catch (err) {
      if (!checarSesion(err)) toast.error((err && err.response && err.response.data && err.response.data.detail) || 'No pude leer la imagen');
    } finally { setLeyendoFoto(false); }
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
  const gravable = (it) => it.tipo !== 'mano_obra' || taxLabor;
  const sumaGrav = items.filter(gravable).reduce((t, it) => t + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0);
  const sumaExenta = suma - sumaGrav;
  const subGrav = ivaIncluido ? sumaGrav / (1 + pct) : sumaGrav;
  const subtotal = subGrav + sumaExenta;
  const iva = subGrav * pct;
  const total = subtotal + iva;

  const costoTotal = items.reduce((c, it) => c + (parseFloat(it.costo) || 0) * (parseInt(it.qty) || 0), 0);
  // Ganancia sobre la venta ANTES de impuesto (el IVA/tax cobrado no es tuyo)
  const ganancia = subtotal - costoTotal;
  const margenPct = subtotal > 0 ? (ganancia / subtotal) * 100 : 0;

  const [parentFolio, setParentFolio] = useState('');
  const iniciarCambio = (folio) => {
    const f = (folio || '').trim().toUpperCase();
    if (!f) return;
    setParentFolio(f);
    setResultado(null); setPaywall(false);
    setItems([{ name: '', qty: 1, unit: 'pza', price: '', tipo: 'material' }, { name: '', qty: 1, unit: 'pza', price: '', tipo: 'material' }]);
    setDudas([]); setNoEnc([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Orden de cambio sobre ' + f + ': captura solo los extras');
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const itemsPdf = items.map(it => it.tipo === 'mano_obra' && !/mano de obra/i.test(it.name)
        ? { ...it, name: `Mano de obra — ${it.name}` } : it).map(it => ({ ...it, gravable: gravable(it) }));
      const r = await axios.post(`${API}/cotizador/guardar`, { items: itemsPdf, cliente, vat_pct: parseFloat(ivaPct) || 0, vat_incluido: ivaIncluido, moneda: esUS ? 'USD' : 'MXN', idioma: esUS ? pdfLang : 'es', parent_folio: parentFolio }, { withCredentials: true });
      setResultado(r.data);
      toast.success(r.data.parent_folio ? `Orden de cambio ${r.data.folio} creada` : `Cotización ${r.data.folio} creada`);
      setParentFolio('');
    } catch (e) {
      if (e?.response?.status === 402) {
        setPaywall(true);
      } else {
        if (!checarSesion(e)) toast.error(e?.response?.data?.detail || 'Error al guardar');
      }
    } finally { setGuardando(false); }
  };

  const esCambio = !!(resultado && resultado.parent_folio);
  const montoTxt = resultado ? `$${resultado.total.toLocaleString('es-MX', {minimumFractionDigits: 2})}${resultado.moneda === 'USD' ? ' USD' : ''}` : '';
  const msgTexto = !resultado ? '' : esCambio
    ? `Hola${cliente ? ' ' + cliente : ''}, te mando la orden de cambio ${resultado.folio} por los trabajos extra (${montoTxt}) sobre la cotización ${resultado.parent_folio}. Revísala y apruébala aquí antes de que empecemos: ${resultado.aprobar_link}`
    : `Hola${cliente ? ' ' + cliente : ''}, aquí está tu cotización ${resultado.folio} por ${montoTxt}: ${resultado.link}`;
  const msgWhats = encodeURIComponent(msgTexto);
  const msgMail = resultado
    ? `mailto:?subject=${encodeURIComponent('Cotización ' + resultado.folio)}&body=${encodeURIComponent(msgTexto)}`
    : '#';

  return (
    <div className="space-y-6 max-w-4xl">
      {(cargando || leyendoFoto) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-10 text-center max-w-sm w-full">
            <div className="text-6xl animate-bounce mb-4">{leyendoFoto ? '📷' : '🪄'}</div>
            <p className="text-xl font-bold text-slate-900 mb-1">{leyendoFoto ? 'Leyendo tu imagen...' : 'Cargando tus productos...'}</p>
            <p className="text-sm text-slate-500">La IA está armando los renglones de tu cotización. Unos segunditos ⏳</p>
            <div className="mt-5 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-violet-500 rounded-full animate-pulse" style={{ animation: 'barrita 1.2s ease-in-out infinite' }} />
            </div>
            <style>{'@keyframes barrita { 0% { margin-left: -50%; } 100% { margin-left: 100%; } }'}</style>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cotizador IA</h2>
          <p className="text-slate-600 text-sm">Captura tu cotización como en Excel — o pega la lista del cliente (o un screenshot) y la IA la llena por ti.</p>
          <p className="text-xs text-violet-700 mt-1 font-medium">Plan Cotizador IA: cotizaciones ilimitadas por {esUS ? "$15 USD/mes" : "$299/mes"} · <a href="/precios" className="underline">ver planes</a></p>

        </div>
      </div>

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
          ✍️ Ya puse en la tabla lo que no estaba en tu catálogo — <strong>solo ponles precio</strong>.
          <a href="/productos" className="underline font-medium ml-1">Agrégalos a tu catálogo</a> y la próxima vez saldrán con precio solos.
        </div>
      )}

      {parentFolio ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-amber-900">➕ Orden de cambio sobre {parentFolio}</p>
            <p className="text-sm text-amber-800">Captura solo los trabajos extra. Tu cliente la aprueba desde su celular antes de que empieces — y queda registrado.</p>
          </div>
          <button onClick={() => setParentFolio('')} className="text-sm text-amber-700 underline">Cancelar</button>
        </div>
      ) : (
        <div className="text-right -mb-3">
          <button
            onClick={() => { const f = window.prompt('¿Sobre qué cotización es el extra? Escribe su folio (ej: CX-7K2M4)'); if (f) iniciarCambio(f); }}
            className="text-xs text-amber-700 hover:text-amber-800 font-medium"
          >➕ ¿Te pidieron un extra en una obra? Haz una orden de cambio</button>
        </div>
      )}

      {/* La cotización — tabla tipo Excel, siempre visible */}
      {(
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
              <span className="col-span-5">Producto</span><span className={modoGanancia ? 'col-span-1' : 'col-span-2'}>Cant.</span>
              <span className={modoGanancia ? 'col-span-1' : 'col-span-2'}>Unidad</span><span className="col-span-2">Precio</span>
              {modoGanancia && <span className="col-span-2 text-violet-600">Mi costo 🔒</span>}<span></span>
            </div>
            <p className="text-[11px] text-slate-400 px-1 -mt-1">👆 Toca la etiqueta 📦 Material para cambiarla a 👷 Mano de obra (y al revés) — el PDF separa los dos.</p>
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
                <input className={`${modoGanancia ? 'col-span-1' : 'col-span-2'} px-2 py-2 border border-slate-300 rounded-lg text-sm`} type="number" min="1" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} />
                <input className={`${modoGanancia ? 'col-span-1' : 'col-span-2'} px-2 py-2 border border-slate-300 rounded-lg text-sm`} value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" type="number" step="0.01" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} />
                {modoGanancia && (
                  <input className="col-span-2 px-3 py-2 border border-violet-200 bg-violet-50/50 rounded-lg text-sm" type="number" step="0.01" placeholder="costo" value={it.costo || ''} onChange={(e) => setItem(i, 'costo', e.target.value)} />
                )}
                <button onClick={() => quitarRenglon(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={() => agregarRenglon('material')} className="text-sm text-violet-700 flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5 hover:bg-violet-100"><Plus className="w-4 h-4" /> Material</button>
              <button onClick={() => agregarRenglon('mano_obra')} className="text-sm text-amber-700 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-100"><Plus className="w-4 h-4" /> 👷 Mano de obra</button>
              <button onClick={toggleGanancia} className={`text-sm flex items-center gap-1 rounded-full px-3 py-1.5 border ml-auto ${modoGanancia ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                💰 ¿Cuánto me queda?
              </button>
            </div>
            {modoGanancia && (
              <p className="text-xs text-violet-600">🔒 Pon lo que a TI te cuesta cada renglón (material, cuadrilla, gasolina). Es privado: no sale en el PDF ni lo ve tu cliente. La ganancia se calcula sobre la venta antes de {etiquetaImpuesto} y es tan exacta como los costos que captures.</p>
            )}

            <div className="border-t pt-3 text-sm text-slate-700 space-y-2">
              <div className="flex flex-wrap items-center gap-3 justify-end text-xs text-slate-600">
                <div className="flex rounded-full border border-slate-200 overflow-hidden mr-2">
                  <button type="button" onClick={() => cambiarRegion('MX')} className={`px-3 py-1 text-xs font-bold ${!esUS ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500'}`}>🇲🇽 MXN</button>
                  <button type="button" onClick={() => cambiarRegion('US')} className={`px-3 py-1 text-xs font-bold ${esUS ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>🇺🇸 USD</button>
                </div>
                {esUS && (
                  <select
                    value={estadoUS}
                    onChange={(e) => elegirEstadoUS(e.target.value)}
                    className="border border-slate-300 rounded-full px-2 py-1 text-xs bg-white mr-1"
                    title="El sales tax varía por estado (y a veces por ciudad y tipo de trabajo) — elige el tuyo y ajusta si hace falta"
                  >
                    <option value="">📍 Tasa de referencia por estado...</option>
                    {Object.keys(TAX_ESTADOS_US).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                )}
                {esUS && (
                  <div className="flex items-center gap-1 mr-2">
                    <span className="text-slate-500">PDF en:</span>
                    <div className="flex rounded-full border border-slate-200 overflow-hidden">
                      <button type="button" onClick={() => cambiarPdfLang('es')} className={`px-3 py-1 text-xs font-bold ${pdfLang === 'es' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>Español</button>
                      <button type="button" onClick={() => cambiarPdfLang('en')} className={`px-3 py-1 text-xs font-bold ${pdfLang === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>English</button>
                    </div>
                  </div>
                )}
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
              {esUS && items.some(it => it.tipo === 'mano_obra') && (
                <label className="flex items-center justify-end gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={taxLabor} onChange={(e) => cambiarTaxLabor(e.target.checked)} />
                  Cobrar tax también a la mano de obra
                  <span className="text-slate-400">(en muchos estados la labor no lleva sales tax — revisa la regla de tu estado y tipo de trabajo)</span>
                </label>
              )}
              {items.some(it => it.tipo === 'mano_obra') && items.some(it => it.tipo !== 'mano_obra') && (
                <>
                  <div className="flex justify-end gap-8 text-slate-500"><span>📦 Materiales:</span><span className="w-28 text-right">${items.filter(it => it.tipo !== 'mano_obra').reduce((t, it) => t + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
                  <div className="flex justify-end gap-8 text-slate-500"><span>👷 Mano de obra:</span><span className="w-28 text-right">${items.filter(it => it.tipo === 'mano_obra').reduce((t, it) => t + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
                </>
              )}
              <div className="flex justify-end gap-8"><span>Subtotal:</span><span className="w-28 text-right">${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-end gap-8"><span>{etiquetaImpuesto} {ivaPct || 0}%:</span><span className="w-28 text-right">${iva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-end gap-8 font-bold text-slate-900"><span>TOTAL:</span><span className="w-28 text-right">${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              {modoGanancia && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5 mt-2 text-right space-y-1">
                  <div className="flex justify-end gap-8 text-violet-700"><span>🔒 Te cuesta:</span><span className="w-28 text-right">${costoTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
                  <div className={`flex justify-end gap-8 font-bold ${ganancia >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    <span>{ganancia >= 0 ? '💰 Ganancia estimada:' : '⚠️ Pérdida estimada:'}</span>
                    <span className="w-28 text-right">${Math.abs(ganancia).toLocaleString('es-MX', {minimumFractionDigits: 2})} ({margenPct.toFixed(0)}%)</span>
                  </div>
                  {ganancia >= 0 && margenPct < 20 && costoTotal > 0 && (
                    <p className="text-[11px] text-amber-700">⚠️ Margen abajo del 20% — revisa si contaste preparación, transporte, desperdicio y segunda visita.</p>
                  )}
                  <p className="text-[11px] text-violet-500">Sobre la venta antes de {etiquetaImpuesto} (${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}) y según los costos que capturaste.</p>
                </div>
              )}
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

      {/* ¿Te mandaron la lista? La IA la captura por ti */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <label className="text-sm font-medium text-slate-700">🪄 ¿Te mandaron la lista? Pégala aquí y la IA llena la tabla por ti</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder={'Ej:\n10 cemento gris\n5 varilla 3/8\n200 block'}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={cotizarIA} disabled={cargando || leyendoFoto} className="bg-violet-600 hover:bg-violet-700">
              {cargando ? 'Buscando en tu catálogo...' : '✨ Cotizar con IA'}
            </Button>
            <Button type="button" variant="outline" onClick={() => fotoRef.current && fotoRef.current.click()} disabled={cargando || leyendoFoto} className="border-violet-300 text-violet-700 hover:bg-violet-50">
              {leyendoFoto ? '📷 Leyendo tu imagen...' : '📷 O súbele un screenshot / foto'}
            </Button>
            <input ref={fotoRef} type="file" accept="image/*" onChange={subirFoto} className="hidden" />
          </div>
          <p className="text-xs text-slate-400">Desde tu celular: toma screenshot del WhatsApp del cliente y súbelo — la IA lo convierte en renglones y tú solo revisas el precio.</p>
        </CardContent>
      </Card>


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
              Con el <strong>Plan Cotizador IA ({esUS ? "$15 USD/mes" : "$299/mes"})</strong> haces {esUS ? "estimates ilimitados" : "cotizaciones ilimitadas"}
              con tu logo, folio y PDF — y te ahorras horas cada semana.
            </p>
            <a href="/precios">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">Activar mi plan — {esUS ? "$15 USD/mes" : "$299/mes"}</Button>
            </a>
            <p className="text-xs text-slate-400">Se activa en 1 minuto con tarjeta o SPEI · factura disponible</p>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: resultado */}
      {resultado && (
        <Card ref={resultRef} className="border-emerald-300 bg-emerald-50/50">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-lg font-bold text-slate-900">✅ {esCambio ? 'Orden de cambio' : 'Cotización'} <span className="text-emerald-700">{resultado.folio}</span> — {montoTxt}{esCambio ? ` sobre ${resultado.parent_folio}` : ''}</p>
            {esCambio && (
              <div className="bg-white border border-amber-200 rounded-lg px-4 py-3 text-sm text-slate-700 max-w-lg mx-auto">
                📝 Mándale a tu cliente el link para <strong>aprobar</strong> el cambio — guarda su nombre, fecha y hora:
                <div className="flex gap-2 mt-2 justify-center">
                  <code className="text-xs bg-slate-50 border rounded px-2 py-1 truncate max-w-[240px]">{resultado.aprobar_link}</code>
                  <button onClick={() => { navigator.clipboard.writeText(resultado.aprobar_link); toast.success('Link de aprobación copiado'); }} className="text-xs text-amber-700 underline">Copiar</button>
                </div>
              </div>
            )}
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
            <button
              onClick={() => iniciarCambio(resultado.parent_folio || resultado.folio)}
              className="inline-flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-semibold rounded-full px-5 py-2 border border-amber-300"
            >
              ➕ ¿Te pidieron algo extra? Haz una orden de cambio sobre {resultado.parent_folio || resultado.folio}
            </button>
            <div className="bg-white border border-violet-200 rounded-lg px-4 py-3 text-sm text-slate-700 max-w-lg mx-auto">
              ✨ Esto es el <strong>Plan Cotizador IA — {esUS ? "$15 USD/mes" : "$299/mes"}</strong>: {esUS ? "estimates ilimitados" : "cotizaciones ilimitadas"} con tu logo y folio.
              <a href="/precios" className="text-violet-700 underline font-medium ml-1">Activar mi plan</a>
            </div>
            <a href="/precios" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full px-5 py-2.5 mt-1">
              🤖 ¿Y si se contestara solo cuando el cliente te escribe? Ver CotizaBot — {esUS ? "$49 USD/mes" : "$1,000/mes"} →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
