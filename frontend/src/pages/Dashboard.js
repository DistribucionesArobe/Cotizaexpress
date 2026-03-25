cat /home/claude/fixes/Conversaciones.js
Output

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Conversaciones() {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarConversaciones();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Conversaciones WhatsApp</h2>
        <p className="text-slate-600 mt-1">{conversaciones.length} conversaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversaciones */}
        <div className="lg:col-span-1 space-y-3">
          {conversaciones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No hay conversaciones aún</p>
                <p className="text-slate-400 text-sm mt-1">Las conversaciones de WhatsApp aparecerán aquí</p>
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

        {/* Mensajes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {conversacionSeleccionada
                ? `Chat: ${conversacionSeleccionada.replace('whatsapp:', '')}`
                : 'Selecciona una conversación'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!conversacionSeleccionada ? (
              <div className="py-12 text-center text-slate-500">
                Selecciona una conversación para ver los mensajes
              </div>
            ) : mensajes.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No hay mensajes en esta conversación
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {mensajes.map((msg, idx) => (
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
                      <p className={`text-xs mt-1 ${
                        msg.role === 'bot' || msg.role === 'agent' ? 'text-white/70' : 'text-slate-400'
                      }`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleString('es-MX') : ''}
                        {msg.role === 'agent' && ' · Asesor'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
