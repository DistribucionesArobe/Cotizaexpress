import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function FerreteriasSEO() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>CotizaBot para Ferreterías - Automatiza Cotizaciones por WhatsApp</title>
        <meta name="description" content="Software de cotizaciones automáticas para ferreterías en México. CotizaBot responde a tus clientes por WhatsApp 24/7 con precios de herramientas, tornillería y más." />
        <link rel="canonical" href="https://cotizaexpress.com/ferreterias" />
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
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">CotizaBot para <span className="text-amber-600">Ferreterías</span></h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Automatiza las cotizaciones de tu ferretería por WhatsApp. Responde precios de herramientas, tornillería, pinturas y más en segundos.
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
            <h2 className="text-3xl font-bold text-center mb-12">¿Por qué CotizaBot para tu ferretería?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Miles de productos</h3>
                <p className="text-slate-600">Carga todo tu inventario: tornillos, herramientas, pinturas, plomería, eléctrico. El bot los encuentra al instante.</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Entiende a tus clientes</h3>
                <p className="text-slate-600">El cliente escribe "tornillo para madera" y el bot pregunta medida, cabeza y cantidad. Como un vendedor experto.</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">IVA automático</h3>
                <p className="text-slate-600">Todas las cotizaciones incluyen el cálculo correcto de IVA al 16%. Sin errores, sin calculadora.</p>
              </CardContent></Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Productos que puedes cotizar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Herramientas manuales', 'Herramientas eléctricas', 'Tornillería', 'Clavos y fijaciones', 'Pinturas y solventes', 'Plomería', 'Material eléctrico', 'Cerrajería', 'Jardinería', 'Adhesivos', 'Ferretería en general', 'Y mucho más...'].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-amber-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">¿Listo para modernizar tu ferretería?</h2>
            <p className="text-xl text-amber-100 mb-8">Prueba CotizaBot gratis y ve cómo aumentan tus ventas</p>
            <Link to="/registro"><Button size="lg" className="bg-white text-amber-600 hover:bg-slate-50">Comenzar Ahora</Button></Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 CotizaExpress.com - CotizaBot para Ferreterías</p>
          <div className="mt-4 space-x-4 text-sm">
            <Link to="/privacidad" className="text-slate-500 hover:text-white">Privacidad</Link>
            <Link to="/terminos" className="text-slate-500 hover:text-white">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
