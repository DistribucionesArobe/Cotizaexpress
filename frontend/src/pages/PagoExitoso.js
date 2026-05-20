import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('checking');
  const [mensaje, setMensaje] = useState('Verificando tu pago...');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  // Mercado Pago redirect params
  const collectionId = searchParams.get('collection_id');
  const collectionStatus = searchParams.get('collection_status');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const preferenceId = searchParams.get('preference_id');
  // Legacy Stripe param
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // If MP returned "approved" directly, we can fast-track
    if (collectionStatus === 'approved' && (collectionId || paymentId)) {
      verifyPayment();
    } else if (collectionStatus === 'pending') {
      setStatus('pending');
      setMensaje('Tu pago está pendiente de confirmación. Te notificaremos cuando se acredite.');
    } else if (collectionStatus === 'rejected' || collectionStatus === 'cancelled') {
      setStatus('error');
      setMensaje('El pago fue rechazado o cancelado. Por favor intenta de nuevo.');
    } else if (collectionId || paymentId || sessionId) {
      verifyPayment();
    } else {
      setStatus('error');
      setMensaje('No se encontró información del pago');
    }
  }, []);

  const verifyPayment = async () => {
    let attempt = 0;
    const poll = async () => {
      if (attempt >= maxAttempts) {
        setStatus('timeout');
        setMensaje('No pudimos confirmar tu pago. Si completaste el pago, tu plan se activará automáticamente en unos minutos.');
        return;
      }
      attempt++;
      setAttempts(attempt);

      try {
        // Build query params for MP or legacy
        const params = new URLSearchParams();
        if (paymentId) params.set('payment_id', paymentId);
        if (collectionId) params.set('collection_id', collectionId);
        if (collectionStatus) params.set('collection_status', collectionStatus);
        if (externalReference) params.set('external_reference', externalReference);
        if (preferenceId) params.set('preference_id', preferenceId);
        if (sessionId) params.set('session_id', sessionId);

        const response = await axios.get(`${API}/pagos/estado?${params.toString()}`);
        const data = response.data;

        if (data.paid) {
          setStatus('success');
          setMensaje(data.mensaje || '¡Pago exitoso! Tu plan está activo.');
        } else if (data.status === 'pending' || data.status === 'in_process') {
          setStatus('pending');
          setMensaje('Tu pago está siendo procesado. Te notificaremos cuando se acredite.');
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          setStatus('error');
          setMensaje('El pago fue rechazado. Por favor intenta de nuevo.');
        } else {
          // Keep polling
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error verificando pago:', error);
        if (attempt < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setStatus('timeout');
          setMensaje('No pudimos confirmar tu pago. Si completaste el pago, tu plan se activará automáticamente en unos minutos.');
        }
      }
    };
    poll();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            {status === 'checking' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verificando Pago</h1>
                <p className="text-slate-600">{mensaje}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-emerald-700 mb-2">¡Pago Exitoso!</h1>
                <p className="text-slate-600 mb-6">{mensaje}</p>

                <div className="bg-emerald-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-emerald-800 mb-2">Tu plan incluye:</h3>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cotizaciones ilimitadas
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      WhatsApp Business integrado
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tu propio número de WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Soporte prioritario
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Link to="/configuracion-whatsapp">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                      Configurar mi WhatsApp
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full" size="lg">
                      Ir al Dashboard
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {status === 'pending' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-amber-700 mb-2">Pago Pendiente</h1>
                <p className="text-slate-600 mb-6">{mensaje}</p>
                <Link to="/dashboard">
                  <Button className="w-full" size="lg">
                    Ir al Dashboard
                  </Button>
                </Link>
              </>
            )}

            {status === 'expired' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-amber-700 mb-2">Sesión Expirada</h1>
                <p className="text-slate-600 mb-6">{mensaje}</p>
                <Link to="/precios">
                  <Button className="w-full" size="lg">
                    Intentar de nuevo
                  </Button>
                </Link>
              </>
            )}

            {(status === 'error' || status === 'timeout') && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-red-700 mb-2">Error</h1>
                <p className="text-slate-600 mb-6">{mensaje}</p>
                <div className="space-y-3">
                  <Link to="/precios">
                    <Button className="w-full" size="lg">
                      Volver a Precios
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-500">
                    ¿Necesitas ayuda? Contáctanos en{' '}
                    <a href="mailto:contacto@arobegroup.com" className="text-emerald-600 hover:underline">
                      contacto@arobegroup.com
                    </a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
