import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Bot, User, Search, MessageSquare, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/* ── helpers ─────────────────────────────────────────────────────────── */

const formatPhone = (p) => {
  const clean = (p || '').replace('whatsapp:', '');
  if (clean.length === 13 && clean.startsWith('521')) {
    return `+52 1 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  if (clean.length >= 10) {
    return `+${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  return clean;
};

const initials = (phone) => {
  const clean = (phone || '').replace('whatsapp:', '');
  return clean.slice(-2);
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
};

const msgTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const msgDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

/* WhatsApp-style doodle background pattern (SVG data URI) */
const WA_BG = `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='50' height='50' patternUnits='userSpaceOnUse'%3E%3Cpath d='M25 2c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2zm-10 10c1 0 1.5.5 1.5 1.5S16 15 15 15s-1.5-.5-1.5-1.5S14 12 15 12zm20 5c.8 0 1.5.7 1.5 1.5S35.8 20 35 20s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5zm-25 15c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2zm18 3c.8 0 1.2.4 1.2 1.2S28.8 37.4 28 37.4s-1.2-.4-1.2-1.2.4-1.2 1.2-1.2zm12 8c1 0 1.5.5 1.5 1.5S41 42 40 42s-1.5-.5-1.5-1.5S39 38 40 38z' fill='%23dce5db' fill-opacity='.4'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='%23eae6df'/%3E%3Crect width='200' height='200' fill='url(%23p)'/%3E%3C/svg%3E")`;

/* ── component ───────────────────────────────────────────────────────── */

export default function Conversaciones() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [botStates, setBotStates] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => { cargarConversaciones(); }, []);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, [mensajes]);

  const cargarConversaciones = async () => {
    try {
      const r = await axios.get(`${API}/conversations`);
      setConversaciones(r.data.conversations || []);
    } catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  const cargarMensajes = async (phone) => {
    try {
      const r = await axios.get(`${API}/conversations/${encodeURIComponent(phone)}`);
      setMensajes(r.data.messages || []);
      setConversacionSeleccionada(phone);
    } catch (e) { console.error('Error:', e); }
  };

  const toggleBot = async (phone, current) => {
    const next = !current;
    try {
      await axios.put(`${API}/conversations/${encodeURIComponent(phone)}/bot`, { bot_active: next });
      setBotStates(p => ({ ...p, [phone]: next }));
      toast.success(next ? 'Bot activado' : 'Bot pausado');
    } catch { toast.error('Error al cambiar bot'); }
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim() || !conversacionSeleccionada) return;
    try {
      setEnviando(true);
      await axios.post(`${API}/conversations/${encodeURIComponent(conversacionSeleccionada)}/mensaje`, { message: mensaje });
      toast.success('Enviado');
      setMensaje('');
      cargarMensajes(conversacionSeleccionada);
    } catch { toast.error('Error al enviar'); }
    finally { setEnviando(false); }
  };

  const getBotState = (phone) => phone in botStates ? botStates[phone] : true;
  const botActivo = conversacionSeleccionada ? getBotState(conversacionSeleccionada) : true;

  const filtradas = conversaciones.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (c.client_phone || '').includes(q)
      || (c.last_message || '').toLowerCase().includes(q)
      || (c.folio || '').toLowerCase().includes(q);
  });

  /* ── date separators ───────────────────────────────────────────────── */
  const mensajesConFecha = [];
  let lastDate = '';
  for (const msg of mensajes) {
    const d = msgDate(msg.created_at);
    if (d !== lastDate) {
      mensajesConFecha.push({ _type: 'date', date: d });
      lastDate = d;
    }
    mensajesConFecha.push(msg);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">

      {/* ═══ LEFT: Conversation list ═══ */}
      <div className={`${conversacionSeleccionada ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] border-r border-slate-200`}>

        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold text-base">Conversaciones</h2>
          </div>
          <span className="text-emerald-100 text-xs">{conversaciones.length} chats</span>
        </div>

        {/* Search */}
        <div className="p-2 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por teléfono, folio o mensaje..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtradas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              {busqueda ? 'Sin resultados' : 'No hay conversaciones aún'}
            </div>
          ) : (
            filtradas.map(conv => {
              const phone = conv.client_phone;
              const selected = conversacionSeleccionada === phone;
              return (
                <div
                  key={phone}
                  onClick={() => cargarMensajes(phone)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 transition-colors
                    ${selected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{initials(phone)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm truncate">
                        {formatPhone(phone)}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {timeAgo(conv.last_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-500 truncate flex-1">
                        {conv.last_role === 'bot' && <span className="text-emerald-500">🤖 </span>}
                        {conv.last_role === 'agent' && <span className="text-blue-500">👤 </span>}
                        {conv.last_message || 'Sin mensajes'}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {conv.folio && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                            {conv.folio}
                          </span>
                        )}
                        {conv.total_msgs > 0 && (
                          <span className="bg-emerald-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                            {conv.total_msgs > 99 ? '99+' : conv.total_msgs}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ RIGHT: Chat panel ═══ */}
      <div className={`${conversacionSeleccionada ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>

        {!conversacionSeleccionada ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: WA_BG }}>
            <div className="bg-white/80 rounded-2xl p-8 text-center shadow-sm">
              <MessageSquare className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">CotizaBot Conversaciones</h3>
              <p className="text-slate-500 mt-2 text-sm">Selecciona una conversación para ver los mensajes</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-3 shadow-sm">
              {/* Back button (mobile) */}
              <button
                onClick={() => setConversacionSeleccionada(null)}
                className="lg:hidden text-white p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{initials(conversacionSeleccionada)}</span>
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {formatPhone(conversacionSeleccionada)}
                </p>
                <p className="text-emerald-100 text-xs">
                  {botActivo ? '🤖 Bot respondiendo' : '👤 Modo manual'}
                </p>
              </div>

              {/* Bot toggle */}
              <button
                onClick={() => toggleBot(conversacionSeleccionada, getBotState(conversacionSeleccionada))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${botActivo
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/40'
                    : 'bg-white/10 text-white/70 border border-white/20'
                  }`}
                title={botActivo ? 'Clic para tomar control manual' : 'Clic para activar respuestas automáticas'}
              >
                {botActivo ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {botActivo ? 'Bot activo' : 'Manual'}
              </button>
            </div>

            {/* Bot paused banner */}
            {!botActivo && (
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Bot pausado — escribe abajo para responder manualmente
              </div>
            )}

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3"
              style={{ background: WA_BG }}
              ref={scrollRef}
            >
              {mensajesConFecha.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 bg-white/70 px-4 py-2 rounded-lg text-sm">Sin mensajes</p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-1">
                  {mensajesConFecha.map((item, idx) => {
                    /* Date separator */
                    if (item._type === 'date') {
                      return (
                        <div key={`date-${idx}`} className="flex justify-center my-3">
                          <span className="bg-white/90 text-slate-500 text-xs px-3 py-1 rounded-lg shadow-sm font-medium">
                            {item.date}
                          </span>
                        </div>
                      );
                    }

                    const msg = item;
                    const isOut = msg.role === 'bot' || msg.role === 'agent';
                    const isAgent = msg.role === 'agent';

                    return (
                      <div key={idx} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[80%] lg:max-w-[65%] px-3 py-1.5 mb-0.5 shadow-sm
                          ${isOut
                            ? isAgent
                              ? 'bg-blue-100 rounded-tl-lg rounded-bl-lg rounded-br-lg rounded-tr-sm'
                              : 'bg-emerald-100 rounded-tl-lg rounded-bl-lg rounded-br-lg rounded-tr-sm'
                            : 'bg-white rounded-tr-lg rounded-br-lg rounded-bl-lg rounded-tl-sm'
                          }`}
                        >
                          {/* Agent label */}
                          {isAgent && (
                            <p className="text-[10px] font-semibold text-blue-600 mb-0.5">Asesor</p>
                          )}

                          {/* Message text */}
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>

                          {/* Timestamp + ticks */}
                          <div className={`flex items-center justify-end gap-1 mt-0.5 -mb-0.5`}>
                            <span className="text-[10px] text-slate-400">{msgTime(msg.created_at)}</span>
                            {isOut && (
                              <span className="text-emerald-500 text-[10px]">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input bar */}
            {!botActivo && (
              <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje()}
                  className="flex-1 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={enviarMensaje}
                  disabled={enviando || !mensaje.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${mensaje.trim()
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Bot active indicator */}
            {botActivo && (
              <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2.5 flex items-center justify-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 font-medium">El bot está respondiendo automáticamente</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
