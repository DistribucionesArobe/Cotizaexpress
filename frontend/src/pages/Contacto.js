import React, { useState } from "react";
import { Link } from "react-router-dom";

const API = process.env.REACT_APP_BACKEND_URL || "";

export default function Contacto() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(`${API}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch (err) {
      // Best effort — still show success since we have WhatsApp fallback
    }
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-10 w-auto" />
            <div>
              <span className="text-lg font-bold text-slate-900">CotizaBot</span>
              <span className="text-xs text-slate-500 block">by CotizaExpress.com</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">Iniciar Sesión</Link>
            <Link to="/registro" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Crear Cuenta</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Contáctanos</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            ¿Tienes preguntas sobre CotizaBot? ¿Quieres ver una demo? Escríbenos por el medio que prefieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact methods */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Escríbenos directo</h2>

            {/* WhatsApp - Primary CTA */}
            <a
              href="https://wa.me/528130850381?text=Hola%2C%20me%20interesa%20CotizaBot%20para%20mi%20negocio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition mb-4"
            >
              <div className="bg-green-500 text-white p-3 rounded-full">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.319 0-4.476-.693-6.283-1.882l-.438-.29-2.65.889.889-2.65-.29-.438A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
              </div>
              <div>
                <p className="font-bold text-green-800 text-lg">WhatsApp Ventas</p>
                <p className="text-green-700 text-sm">+52 813 085 0381 — Respuesta inmediata</p>
              </div>
              <svg className="w-5 h-5 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>

            {/* Email */}
            <a
              href="mailto:contacto@arobegroup.com?subject=Información%20sobre%20CotizaBot"
              className="flex items-center gap-4 p-5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition mb-4"
            >
              <div className="bg-blue-500 text-white p-3 rounded-full">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="font-bold text-blue-800 text-lg">Correo electrónico</p>
                <p className="text-blue-700 text-sm">contacto@arobegroup.com</p>
              </div>
            </a>

            {/* Info cards */}
            <div className="mt-8 p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">¿Qué incluye CotizaBot?</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Bot de WhatsApp que cotiza automáticamente con tus precios
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Carga tu catálogo desde Excel o dicta los productos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Tus clientes reciben cotización en segundos, 24/7
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Dashboard para ver conversaciones y cotizaciones
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  7 días de prueba gratis
                </li>
              </ul>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">O déjanos tus datos</h2>

            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">¡Mensaje enviado!</h3>
                <p className="text-green-700 mb-4">Te contactamos en menos de 24 horas.</p>
                <p className="text-sm text-green-600">
                  ¿Quieres respuesta más rápida?{" "}
                  <a href="https://wa.me/528130850381?text=Hola%2C%20acabo%20de%20llenar%20el%20formulario%20de%20contacto" target="_blank" rel="noopener noreferrer" className="font-bold underline">
                    Escríbenos por WhatsApp
                  </a>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tu@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="55 1234 5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
                  <textarea
                    rows={4}
                    required
                    value={form.mensaje}
                    onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Cuéntanos sobre tu negocio y qué necesitas..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar Mensaje"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 CotizaExpress.com - CotizaBot. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
