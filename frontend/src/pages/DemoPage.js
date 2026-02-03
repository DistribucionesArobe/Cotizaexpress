import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Demo Gratis - Prueba CotizaBot por WhatsApp | CotizaExpress</title>
        <meta name="description" content="Prueba CotizaBot gratis enviando DEMO a nuestro WhatsApp. Ve cómo el bot genera cotizaciones automáticas para tu ferretería o negocio." />
        <link rel="canonical" href="https://cotizaexpress.com/demo" />
      </Helmet>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-slate-900">CotizaBot</Link>
          <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Crear Cuenta</Button></Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-center text-slate-900 mb-6">Prueba CotizaBot Gratis</h1>
        <p className="text-xl text-center text-slate-600 mb-12 max-w-2xl mx-auto">
          Envía "DEMO" a nuestro WhatsApp y experimenta cómo CotizaBot puede automatizar las cotizaciones de tu negocio.
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Instrucciones</h2>
          <ol className="text-left text-slate-600 space-y-4 mb-8">
            <li className="flex gap-3"><span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</span>Haz clic en el botón de abajo</li>
            <li className="flex gap-3"><span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</span>Se abrirá WhatsApp con el mensaje "DEMO"</li>
            <li className="flex gap-3"><span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">3</span>Envía el mensaje y prueba pedir una cotización</li>
          </ol>

          <a href="https://wa.me/5218344291628?text=DEMO" target="_blank" rel="noopener noreferrer" className="block">
            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg py-6">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Abrir WhatsApp Demo
            </Button>
          </a>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">¿Qué puedes probar en el demo?</h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Pide una cotización</h3>
              <p className="text-sm text-slate-600">Escribe "cuánto cuesta el cemento" o "precio de tablaroca"</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Escribe con errores</h3>
              <p className="text-sm text-slate-600">El bot entiende aunque escribas "sement" o "tablarok"</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold mb-2">Confirma la cotización</h3>
              <p className="text-sm text-slate-600">Responde "sí" para ver el flujo de pago</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
