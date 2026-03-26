import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Bot, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Conversaciones() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [botStates, setBotStates] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    cargarConversaciones();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 50);
  }, [mensajes]);

  const cargarConversaciones = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversaciones(response.data.conversations || []);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async (clientPhone) => {
    try {
      const response = await axios.get(`${API}/conversations/${encodeURIComponent(clientPhone)}`);
      setMensajes(response.data.messages || []);
      setConversacionSeleccionada(clientPhone);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const toggleBot = async (clientPhone, currentState) => {
    const newState = !currentState;
    try {
      await axios.put(`${API}/conversations/${encodeURIComponent(clientPhone)}/bot`, {
        bot_active: newState
      });
      setBotStates(prev => ({ ...prev, [clientPhone]: newState }));
      toast.success(newState ? 'Bot activado' : 'Bot pausado — puedes escribir manualmente');
    } catch (e) {
      toast.error('Error al cambiar estado del bot');
    }
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim() || !conversacionSeleccionada) return;
    try {
      setEnviando(true);
      await axios.post(`${API}/conversations/${encodeURIComponent(conversacionSeleccionada)}/mensaje`, {
        message: mensaje
      });
      toast.success('Mensaje enviado');
      setMensaje('');
      cargarMensajes(conversacionSeleccionada);
    } catch (e) {
      toast.error('Error al enviar mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const getBotState = (phone) => {
    if (phone in botStates) return botStates[phone];
    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const botActivo = conversacionSeleccionada ? getBotState(conversacionSeleccionada) : true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Conversaciones WhatsApp</h2>
        <p className="text-slate-600 mt-1">{conversaciones.length} conversaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {conversaciones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No hay conversaciones aún</p>
              </CardContent>
            </Card>
          ) : (
            conversaciones.map((conv) => (
              <Card
                key={conv.client_phone}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  conversacionSeleccionada === conv.client_phone
                    ? 'border-emerald-500 bg-emerald-50'
                    : ''
                }`}
                onClick={() => cargarMensajes(conv.client_phone)}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">
                        {conv.client_phone?.replace('whatsapp:', '') || 'Sin teléfono'}
                      </p>
                      {conv.last_message && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{conv.last_message}</p>
                      )}
                      {conv.last_at && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(conv.last_at).toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-1">
                      <Badge variant={conv.last_role === 'bot' ? 'default' : 'secondary'} className="text-xs">
                        {conv.last_role || 'bot'}
                      </Badge>
                      {conv.total_msgs && (
                        <span className="text-xs text-slate-400">{conv.total_msgs} msgs</span>
                      )}
                    </div>
                  </div>
                  {conv.folio && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">📋 Folio: {conv.folio}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {conversacionSeleccionada
                  ? conversacionSeleccionada.replace('whatsapp:', '')
                  : 'Selecciona una conversación'}
              </CardTitle>

              {conversacionSeleccionada && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{botActivo ? 'Bot activo' : 'Bot pausado'}</span>
                  <button
                    onClick={() => toggleBot(conversacionSeleccionada, getBotState(conversacionSeleccionada))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${botActivo ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow ${botActivo ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                  {botActivo
                    ? <Bot className="w-4 h-4 text-emerald-600" />
                    : <User className="w-4 h-4 text-blue-600" />
                  }
                </div>
              )}
            </div>

            {conversacionSeleccionada && !botActivo && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 mt-1">
                Bot pausado — escribe abajo para responder manualmente al cliente
              </p>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {!conversacionSeleccionada ? (
              <div className="py-12 text-center text-slate-500">
                Selecciona una conversación para ver los mensajes
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[500px] overflow-y-auto mb-4 bg-slate-50 rounded-lg p-2" ref={scrollContainerRef}>
                  {mensajes.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">No hay mensajes</div>
                  ) : (
                    mensajes.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'bot' || msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-2 ${
                            msg.role === 'bot'
                              ? 'bg-emerald-500 text-white'
                              : msg.role === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.role === 'bot' || msg.role === 'agent' ? 'text-white/70' : 'text-slate-400'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleString('es-MX') : ''}
                            {msg.role === 'agent' && ' · Asesor'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {!botActivo && (
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <Input
                      placeholder="Escribe un mensaje como asesor..."
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje()}
                      className="flex-1"
                    />
                    <Button
                      onClick={enviarMensaje}
                      disabled={enviando || !mensaje.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}