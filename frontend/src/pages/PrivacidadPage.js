import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Aviso de Privacidad - CotizaBot | CotizaExpress.com</title>
        <meta name="description" content="Aviso de privacidad de CotizaBot y CotizaExpress.com. Conoce cómo protegemos y utilizamos tus datos personales." />
        <link rel="canonical" href="https://cotizaexpress.com/privacidad" />
      </Helmet>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold text-slate-900">CotizaBot</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Aviso de Privacidad</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">Última actualización: Febrero 2026</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Responsable del Tratamiento</h2>
          <p>AROBE GROUP, con domicilio en Monterrey, Nuevo León, México, es responsable del tratamiento de sus datos personales a través de la plataforma CotizaBot (cotizaexpress.com).</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Datos Personales Recolectados</h2>
          <p>Recopilamos los siguientes datos:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Nombre y razón social</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Dirección fiscal (para facturación)</li>
            <li>RFC (para facturación CFDI)</li>
            <li>Información de pago (procesada por Stripe)</li>
            <li>Conversaciones de WhatsApp relacionadas con cotizaciones</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Finalidades del Tratamiento</h2>
          <p>Sus datos personales serán utilizados para:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Proveer el servicio de cotizaciones automatizadas</li>
            <li>Procesar pagos y suscripciones</li>
            <li>Emitir facturas fiscales (CFDI)</li>
            <li>Enviar notificaciones del servicio</li>
            <li>Mejorar nuestros productos y servicios</li>
            <li>Atender solicitudes de soporte</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Transferencia de Datos</h2>
          <p>Sus datos pueden ser compartidos con:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Stripe (procesamiento de pagos)</li>
            <li>360dialog (integración de WhatsApp)</li>
            <li>Facturama (emisión de CFDI)</li>
            <li>OpenAI (procesamiento de lenguaje natural)</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Derechos ARCO</h2>
          <p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, contacte a: contacto@arobegroup.com</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Seguridad</h2>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos, incluyendo encriptación, control de acceso y monitoreo continuo.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Contacto</h2>
          <p>Para dudas sobre este aviso de privacidad:</p>
          <p>Email: contacto@arobegroup.com</p>
          <p>Teléfono: +52 81 3078 3171</p>
        </div>
      </main>

      <footer className="bg-slate-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2026 CotizaExpress.com</p>
        </div>
      </footer>
    </div>
  );
}
