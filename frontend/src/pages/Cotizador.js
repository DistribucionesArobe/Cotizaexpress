import { useState } from 'react';
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

  const cotizarIA = async () => {
    if (!texto.trim()) { toast.error('Pega la lista del cliente'); return; }
    setCargando(true); setResultado(null);
    try {
      const r = await axios.post(`${API}/cotizador/ia`, { texto }, { withCredentials: true });
      setItems(r.data.encontrados || []);
      setDudas(r.data.dudas || []);
      setNoEnc(r.data.no_encontrados || []);
      if ((r.data.encontrados || []).length === 0 && (r.data.dudas || []).length === 0) {
        toast.info('No encontré esos productos en tu catálogo. Agrega renglones a mano o revisa tu catálogo.');
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

  const agregarRenglon = () => setItems(prev => [...prev, { name: '', qty: 1, unit: 'pza', price: '' }]);
  const quitarRenglon = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0);
  const iva = subtotal * 0.16;

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await axios.post(`${API}/cotizador/guardar`, { items, cliente }, { withCredentials: true });
      setResultado(r.data);
      toast.success(`Cotización ${r.data.folio} creada`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Error al guardar');
    } finally { setGuardando(false); }
  };

  const msgWhats = resultado
    ? encodeURIComponent(`Hola${cliente ? ' ' + cliente : ''}, aquí está tu cotización ${resultado.folio} por $${resultado.total.toLocaleString('es-MX', {minimumFractionDigits: 2})}: ${resultado.link}`)
    : '';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cotizador IA</h2>
          <p className="text-slate-600 text-sm">Pega la lista de tu cliente tal como te la mandó — la IA la convierte en cotización con tu catálogo.</p>
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

      {noEnc.length > 0 && noEnc[0] && (
        <p className="text-sm text-slate-500">🚫 No están en tu catálogo: {noEnc.join(', ')} — agrégalos a mano abajo si los manejas.</p>
      )}

      {/* Paso 2: tabla editable */}
      {(items.length > 0 || dudas.length > 0) && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
              <span className="col-span-5">Producto</span><span className="col-span-2">Cantidad</span>
              <span className="col-span-2">Unidad</span><span className="col-span-2">Precio</span><span></span>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className="col-span-5 px-3 py-2 border border-slate-300 rounded-lg text-sm" value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" type="number" min="1" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} />
                <input className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm" type="number" step="0.01" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} />
                <button onClick={() => quitarRenglon(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={agregarRenglon} className="text-sm text-violet-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar renglón</button>

            <div className="border-t pt-3 text-sm text-slate-700 space-y-1">
              <div className="flex justify-end gap-8"><span>Subtotal:</span><span className="w-28 text-right">${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-end gap-8"><span>IVA 16%:</span><span className="w-28 text-right">${iva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-end gap-8 font-bold text-slate-900"><span>TOTAL:</span><span className="w-28 text-right">${(subtotal + iva).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></div>
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

      {/* Paso 3: resultado */}
      {resultado && (
        <Card className="border-emerald-300 bg-emerald-50/50">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-lg font-bold text-slate-900">✅ Cotización <span className="text-emerald-700">{resultado.folio}</span> — ${resultado.total.toLocaleString('es-MX', {minimumFractionDigits: 2})} + IVA</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={`https://wa.me/?text=${msgWhats}`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#25D366] hover:bg-[#1ebe57]">Enviar por WhatsApp</Button>
              </a>
              <a href={resultado.link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline"><FileText className="w-4 h-4 mr-2" />Ver / descargar</Button>
              </a>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(resultado.link); toast.success('Link copiado'); }}>
                <Copy className="w-4 h-4 mr-2" />Copiar link
              </Button>
            </div>
            <p className="text-xs text-slate-500">💡 ¿Te imaginas que esto se contestara solo cuando el cliente escribe? Eso hace CotizaBot al conectar tu WhatsApp.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
