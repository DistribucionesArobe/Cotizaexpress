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
      const response = await axios.get(`${API}/conversaciones`);
      setConversaciones(response.data);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async (conversacionId) => {
    try {
      const response = await axios.get(
        `${API}/conversaciones/${conversacionId}/mensajes`
      );
      setMensajes(response.data);
      setConversacionSeleccionada(conversacionId);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12" data-testid="conversaciones-loading">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6" data-testid="conversaciones-container">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Conversaciones WhatsApp</h2>
        <p className="text-slate-600 mt-1">
          {conversaciones.length} conversaciones activas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversaciones */}
        <div className="lg:col-span-1 space-y-3">
          {conversaciones.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No hay conversaciones</p>
              </CardContent>
            </Card>
          ) : (
            conversaciones.map((conv) => (
              <Card
                key={conv.id}
                data-testid={`conversacion-${conv.id}`}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  conversacionSeleccionada === conv.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : ''
                }`}
                onClick={() => cargarMensajes(conv.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {conv.cliente_nombre || 'Cliente sin nombre'}
                      </p>
                      <p className="text-sm text-slate-600">{conv.cliente_telefono}</p>
                    </div>
                    <Badge
                      variant={conv.estado === 'activa' ? 'default' : 'secondary'}
                    >
                      {conv.estado}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mensajes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {conversacionSeleccionada ? 'Historial de Mensajes' : 'Selecciona una conversación'}
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    data-testid={`mensaje-${msg.id}`}
                    className={`flex ${
                      msg.direccion === 'saliente' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.direccion === 'saliente'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm">{msg.contenido}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.direccion === 'saliente'
                            ? 'text-emerald-100'
                            : 'text-slate-500'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleString('es-MX')}
                      </p>
                      {msg.agente_procesador && (
                        <p
                          className={`text-xs mt-1 ${
                            msg.direccion === 'saliente'
                              ? 'text-emerald-100'
                              : 'text-slate-500'
                          }`}
                        >
                          Agente: {msg.agente_procesador}
                        </p>
                      )}
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