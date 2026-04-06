import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function RefaccionariasSEO() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>CotizaBot para Refaccionarias - Cotiza Autopartes por WhatsApp</title>
        <meta name="description" content="Software de cotizaciones automáticas para refaccionarias y tiendas de autopartes en México. Cotiza refacciones, aceites y más por WhatsApp 24/7." />
        <link rel="canonical" href="https://cotizaexpress.com/refaccionarias" />
      </Helmet>

      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-slate-900">CotizaBot</Link>
          <div className="flex gap-4">
            <Link to="/precios" className="text-slate-600 hover:text-emerald-600 hidden sm:block">Precios</Link>
            <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="bg-gradient-to-br from-red-50 to-orange-50 py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">CotizaBot para <span className="text-red-600">Refaccionarias</span></h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Automatiza las cotizaciones de autopartes y refacciones por WhatsApp. Tus clientes preguntan, el bot responde con precios al instante.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">Probar Demo Gratis</Button>
              </a>
              <Link to="/registro"><Button size="lg" variant="outline">Crear Cuenta</Button></Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Ideal para tu refaccionaria</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Catálogo extenso</h3>
                <p className="text-slate-600">Carga miles de refacciones con número de parte, aplicación y precio. El bot las encuentra al instante.</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Búsqueda inteligente</h3>
                <p className="text-slate-600">El cliente dice "balatas para Jetta 2015" y el bot le da opciones con precios de diferentes marcas.</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Disponibilidad</h3>
                <p className="text-slate-600">Muestra si tienes la refacción en stock o el tiempo de entrega si es sobre pedido.</p>
              </CardContent></Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Productos que puedes cotizar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Balatas y frenos', 'Suspensión', 'Motor', 'Transmisión', 'Aceites y lubricantes', 'Filtros', 'Baterías', 'Iluminación', 'Clutch', 'Sistema de enfriamiento', 'Afinación', 'Refacciones en general'].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-red-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Automatiza tu refaccionaria hoy</h2>
            <p className="text-xl text-red-100 mb-8">Deja que CotizaBot atienda a tus clientes mientras tú te enfocas en vender</p>
            <Link to="/registro"><Button size="lg" className="bg-white text-red-600 hover:bg-slate-50">Comenzar Ahora</Button></Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 CotizaExpress.com - CotizaBot para Refaccionarias</p>
        </div>
      </footer>
    </div>
  );
}
