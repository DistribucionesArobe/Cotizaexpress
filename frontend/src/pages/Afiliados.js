import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/* ── Palette & reusable styles (matching LandingPage) ─────────────────────── */
const PRIMARY = '#2563eb';
const PRIMARY_DARK = '#1d4ed8';
const GREEN = '#16a34a';
const GRADIENT = 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)';

const sectionStyle = {
  padding: '80px 20px',
  maxWidth: 1100,
  margin: '0 auto',
};

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Afiliados() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', empresa: '', zona: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/afiliados/registro`, form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Programa de Afiliados - CotizaExpress</title>
        <meta name="description" content="Gana comisiones vendiendo CotizaExpress. Programa de afiliados para vendedores de ferreterías mayoristas." />
      </Helmet>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        background: GRADIENT,
        color: '#fff',
        padding: '100px 20px 80px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '6px 16px',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20,
            letterSpacing: 0.5,
          }}>
            PROGRAMA DE AFILIADOS
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, marginBottom: 20, lineHeight: 1.15 }}>
            Gana dinero vendiendo<br />CotizaExpress
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', opacity: 0.9, marginBottom: 40, maxWidth: 650, margin: '0 auto 40px' }}>
            Recomienda CotizaExpress a ferreterías, refaccionarias y comercios mayoristas.
            Gana una <strong>comisión por cada venta</strong> y un <strong>ingreso recurrente mensual</strong>.
          </p>
          <a href="#registro" style={{ textDecoration: 'none' }}>
            <Button style={{
              background: '#fff',
              color: PRIMARY,
              fontWeight: 700,
              fontSize: 18,
              padding: '14px 40px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
            }}>
              Quiero ser Afiliado
            </Button>
          </a>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 50 }}>
          ¿Cómo funciona?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 30 }}>
          {[
            { step: '1', icon: '📋', title: 'Regístrate', desc: 'Llena el formulario y recibe tu link de referido personalizado.' },
            { step: '2', icon: '🤝', title: 'Recomienda', desc: 'Comparte tu link con ferreterías y comercios que visitas en tus rutas.' },
            { step: '3', icon: '💰', title: 'Gana', desc: 'Recibe comisiones por cada negocio que se suscriba con tu link.' },
          ].map(item => (
            <Card key={item.step} style={{ border: '2px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
              <CardContent style={{ padding: 30, textAlign: 'center' }}>
                <div style={{
                  width: 70, height: 70, borderRadius: '50%', background: `${PRIMARY}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, margin: '0 auto 16px',
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Commissions ─────────────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', padding: '80px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 16 }}>
            Estructura de Comisiones
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 50, fontSize: 17, maxWidth: 600, margin: '0 auto 50px' }}>
            Gana desde el primer día y sigue ganando cada mes mientras tu referido sea cliente.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
            {/* Plan CotizaBot */}
            <Card style={{ border: '2px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: PRIMARY, color: '#fff', padding: '20px 24px', textAlign: 'left' }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Plan CotizaBot</h3>
                <p style={{ opacity: 0.85, margin: '4px 0 0', fontSize: 15 }}>$1,000/mes MXN</p>
              </div>
              <CardContent style={{ padding: 24 }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 600 }}>Bono primer mes</span>
                    <span style={{ color: GREEN, fontWeight: 700, fontSize: 18 }}>$1,000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 600 }}>Comisión mensual (15%)</span>
                    <span style={{ color: GREEN, fontWeight: 700, fontSize: 18 }}>$150/mes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                    <span style={{ fontWeight: 600 }}>Ganancia año 1</span>
                    <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 18 }}>$2,650</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Pro */}
            <Card style={{ border: `2px solid ${PRIMARY}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(37,99,235,0.15)' }}>
              <div style={{ background: GRADIENT, color: '#fff', padding: '20px 24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Plan Pro</h3>
                    <p style={{ opacity: 0.85, margin: '4px 0 0', fontSize: 15 }}>$2,000/mes MXN</p>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
                    MÁS POPULAR
                  </span>
                </div>
              </div>
              <CardContent style={{ padding: 24 }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 600 }}>Bono primer mes</span>
                    <span style={{ color: GREEN, fontWeight: 700, fontSize: 18 }}>$2,000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 600 }}>Comisión mensual (15%)</span>
                    <span style={{ color: GREEN, fontWeight: 700, fontSize: 18 }}>$300/mes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                    <span style={{ fontWeight: 600 }}>Ganancia año 1</span>
                    <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 18 }}>$5,300</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div style={{
            background: `${GREEN}10`,
            border: `1px solid ${GREEN}30`,
            borderRadius: 12,
            padding: 24,
            marginTop: 40,
            maxWidth: 700,
            margin: '40px auto 0',
          }}>
            <p style={{ fontSize: 17, color: '#166534', fontWeight: 600, margin: 0 }}>
              💡 Ejemplo: Si refieres 10 negocios al Plan Pro, ganarías <strong>$20,000 en bonos</strong> + <strong>$3,000/mes recurrente</strong> = <strong>$53,000 en el primer año</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Who is it for ──────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 40, textAlign: 'center' }}>
          ¿Para quién es este programa?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
          {[
            { icon: '🚚', title: 'Vendedores viajeros', desc: 'De ferreterías mayoristas que recorren el país visitando clientes' },
            { icon: '🏪', title: 'Distribuidores', desc: 'Que atienden redes de ferreterías, refaccionarias y materiales' },
            { icon: '👥', title: 'Consultores', desc: 'De tecnología o negocios que asesoran a comercios' },
            { icon: '📱', title: 'Influencers del sector', desc: 'Ferreteros, constructores o comerciantes con audiencia' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 36, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>{item.title}</h3>
                <p style={{ color: '#6b7280', fontSize: 15, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', padding: '80px 20px' }}>
        <div style={{ maxWidth: 750, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 40, textAlign: 'center' }}>
            Preguntas frecuentes
          </h2>
          {[
            { q: '¿Cómo recibo mis comisiones?', a: 'Las comisiones se pagan mensualmente vía Mercado Pago o transferencia bancaria. El pago se procesa los primeros 5 días de cada mes.' },
            { q: '¿Cuánto tiempo duran las comisiones recurrentes?', a: 'Mientras tu referido mantenga su suscripción activa, tú sigues ganando el 15% mensual. Sin límite de tiempo.' },
            { q: '¿Hay un mínimo de ventas?', a: 'No. Puedes referir desde un solo negocio. No hay cuotas mínimas ni compromisos.' },
            { q: '¿Qué herramientas me dan?', a: 'Recibes un link de referido personalizado, material de ventas, y acceso a un panel donde puedes ver tus referidos y comisiones en tiempo real.' },
            { q: '¿Necesito ser vendedor de ferretería?', a: 'No necesariamente, pero el programa está diseñado para vendedores que ya visitan ferreterías, refaccionarias y comercios similares.' },
          ].map((faq, i) => (
            <div key={i} style={{ marginBottom: 24, background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#1e3a5f' }}>{faq.q}</h3>
              <p style={{ fontSize: 15, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Registration Form ──────────────────────────────────────────── */}
      <section id="registro" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 550, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
            Regístrate como Afiliado
          </h2>
          <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: 40, fontSize: 16 }}>
            Completa el formulario y recibe tu link de referido al instante.
          </p>

          {result ? (
            <Card style={{ border: `2px solid ${GREEN}`, borderRadius: 16, overflow: 'hidden' }}>
              <CardContent style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: GREEN, marginBottom: 12 }}>
                  ¡Registro exitoso!
                </h3>
                <p style={{ marginBottom: 20, color: '#374151' }}>
                  Tu código de referido es:
                </p>
                <div style={{
                  background: '#f0fdf4',
                  border: `2px solid ${GREEN}40`,
                  borderRadius: 10,
                  padding: '16px 24px',
                  marginBottom: 20,
                  fontFamily: 'monospace',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#166534',
                  letterSpacing: 1,
                }}>
                  {result.affiliate?.referral_code}
                </div>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                  Tu link de referido:
                </p>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontSize: 14,
                  wordBreak: 'break-all',
                  color: PRIMARY,
                  fontWeight: 600,
                }}>
                  {result.affiliate?.referral_link}
                </div>
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 16 }}>
                  Revisa tu email para acceder a tu panel de afiliado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card style={{ border: '2px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
              <CardContent style={{ padding: 32 }}>
                <form onSubmit={handleSubmit}>
                  {[
                    { key: 'nombre', label: 'Nombre completo *', type: 'text', required: true },
                    { key: 'email', label: 'Email *', type: 'email', required: true },
                    { key: 'telefono', label: 'Teléfono (WhatsApp) *', type: 'tel', required: true },
                    { key: 'empresa', label: 'Empresa (opcional)', type: 'text', required: false },
                    { key: 'zona', label: 'Zona que cubres (opcional)', type: 'text', required: false, placeholder: 'Ej: Norte de México, Bajío, CDMX...' },
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={form[field.key]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 15,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      background: PRIMARY,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 16,
                      padding: '12px 0',
                      borderRadius: 10,
                      border: 'none',
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Registrando...' : 'Registrarme como Afiliado'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────────────── */}
      <section style={{ background: GRADIENT, color: '#fff', padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 700, marginBottom: 16 }}>
          ¿Tienes preguntas?
        </h2>
        <p style={{ opacity: 0.9, marginBottom: 30, fontSize: 17 }}>
          Escríbenos por WhatsApp y te explicamos todo sobre el programa.
        </p>
        <a
          href="https://wa.me/5218344291628?text=Hola%2C%20me%20interesa%20el%20programa%20de%20afiliados%20de%20CotizaExpress"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <Button style={{
            background: '#25d366',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            padding: '14px 36px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
          }}>
            WhatsApp: +52 834 429 1628
          </Button>
        </a>
      </section>
    </>
  );
}
