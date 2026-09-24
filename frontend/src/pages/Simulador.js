import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Send, FlaskConical, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'https://api.cotizaexpress.com';
const API = `${BACKEND_URL}/api`;

const SUGERENCIAS = ['hola', '10 cemento, 5 varilla 3/8', '¿tienen pintura?'];

export default function Simulador() {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: '🧪 Este es el simulador: escribe como si fueras tu cliente y mira cómo responde tu bot con TU catálogo real. Prueba con una lista de productos 👇',
    },
  ]);
  const [options, setOptions] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const enviar = async (texto, interactive = false, labelParaMostrar = null) => {
    const t = (texto || '').trim();
    if (!t || sending) return;
    setMessages((prev) => [...prev, { from: 'user', text: labelParaMostrar || t }]);
    setOptions([]);
    setInput('');
    setSending(true);
    try {
      const r = await axios.post(`${API}/simulator/message`, { text: t, interactive }, { withCredentials: true });
      const nuevos = (r.data?.messages || []).filter(Boolean).map((m) => ({ from: 'bot', text: m }));
      setMessages((prev) => [...prev, ...(nuevos.length ? nuevos : [{ from: 'bot', text: '…' }])]);
      setOptions(r.data?.options || []);
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: '⚠️ Error del simulador. Intenta de nuevo.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    enviar(input);
  };

  // Negritas de WhatsApp (*texto*) → <strong>
  const renderTexto = (text) =>
    text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
      part.startsWith('*') && part.endsWith('*') && part.length > 2
        ? <strong key={i}>{part.slice(1, -1)}</strong>
        : <span key={i}>{part}</span>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Probar mi bot</h2>
            <p className="text-slate-600 text-sm">
              Así verán tus clientes a tu bot en WhatsApp — con tu catálogo y precios reales.
            </p>
          </div>
        </div>
        <Link to="/configuracion-whatsapp">
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Conectar a WhatsApp
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-0">
          {/* Header estilo WhatsApp */}
          <div className="bg-[#075E54] text-white px-4 py-3 rounded-t-lg flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div>
              <p className="font-semibold text-sm">Tu CotizaBot</p>
              <p className="text-xs text-emerald-100">{sending ? 'escribiendo...' : 'en línea'}</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="bg-[#ECE5DD] h-[420px] overflow-y-auto p-4 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap shadow-sm ${
                    m.from === 'user' ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'
                  }`}
                >
                  {renderTexto(m.text)}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none text-sm text-slate-400 shadow-sm">
                  escribiendo…
                </div>
              </div>
            )}
            {/* Opciones (botones/listas del bot) */}
            {!sending && options.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {options.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => enviar(o.send, true, o.label)}
                    className="bg-white border border-emerald-300 text-emerald-700 text-sm px-3 py-1.5 rounded-full hover:bg-emerald-50 shadow-sm"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-slate-100 rounded-b-lg">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe como si fueras tu cliente..."
              className="flex-1 px-4 py-2 rounded-full border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-10 h-10 bg-[#25D366] hover:bg-[#1ebe57] disabled:opacity-50 rounded-full flex items-center justify-center text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Sugerencias */}
      <div className="max-w-2xl flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Prueba con:</span>
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            onClick={() => enviar(s)}
            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full"
          >
            "{s}"
          </button>
        ))}
      </div>

      <div className="max-w-2xl bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
        ¿Te gustó cómo responde? <Link to="/configuracion-whatsapp" className="font-semibold underline">Conéctalo a tu WhatsApp</Link> y
        tus clientes recibirán exactamente esto — con cotización en PDF incluida.
      </div>
    </div>
  );
}
