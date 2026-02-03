import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Términos y Condiciones - CotizaBot | CotizaExpress.com</title>
        <meta name="description" content="Términos y condiciones de uso de CotizaBot. Lee las condiciones del servicio de cotizaciones automáticas por WhatsApp." />
        <link rel="canonical" href="https://cotizaexpress.com/terminos" />
      </Helmet>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold text-slate-900">CotizaBot</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">Última actualización: Febrero 2026</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Aceptación de los Términos</h2>
          <p>Al utilizar CotizaBot (cotizaexpress.com), usted acepta estos términos y condiciones en su totalidad. Si no está de acuerdo, no utilice el servicio.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Descripción del Servicio</h2>
          <p>CotizaBot es un software de automatización de cotizaciones por WhatsApp diseñado para PYMEs en México. El servicio incluye:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Bot de WhatsApp para atención automatizada</li>
            <li>Generación de cotizaciones con cálculo de IVA</li>
            <li>Dashboard de administración</li>
            <li>Gestión de productos y catálogo</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Planes y Pagos</h2>
          <p>Los planes disponibles son:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Plan Completo:</strong> $1,000 MXN + IVA mensual</li>
            <li><strong>Plan Pro:</strong> $2,000 MXN + IVA mensual</li>
          </ul>
          <p>Los pagos se procesan a través de Stripe de forma segura. Las suscripciones se renuevan automáticamente.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Cancelación</h2>
          <p>Puede cancelar su suscripción en cualquier momento desde el dashboard. La cancelación toma efecto al final del período de facturación actual. No hay reembolsos por períodos parciales.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Uso Aceptable</h2>
          <p>Usted se compromete a:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>No usar el servicio para actividades ilegales</li>
            <li>No enviar spam o mensajes no solicitados</li>
            <li>Mantener la información de su cuenta actualizada</li>
            <li>No compartir sus credenciales de acceso</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Propiedad Intelectual</h2>
          <p>CotizaBot y todo su contenido son propiedad de AROBE GROUP. Usted conserva los derechos sobre sus datos y catálogo de productos.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Limitación de Responsabilidad</h2>
          <p>CotizaBot se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido o libre de errores. No somos responsables por pérdidas indirectas derivadas del uso del servicio.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos. Los cambios serán notificados por correo electrónico con 30 días de anticipación.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Ley Aplicable</h2>
          <p>Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales de Monterrey, Nuevo León.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Contacto</h2>
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
