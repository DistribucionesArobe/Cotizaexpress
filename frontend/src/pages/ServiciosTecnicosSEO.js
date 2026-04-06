import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function ServiciosTecnicosSEO() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>CotizaBot para Servicios Técnicos - Cotiza Instalaciones por WhatsApp</title>
        <meta name="description" content="Software de cotizaciones para plomeros, electricistas y técnicos en México. Cotiza servicios de instalación y reparación automáticamente por WhatsApp." />
        <link rel="canonical" href="https://cotizaexpress.com/servicios-tecnicos" />
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
        <section className="bg-gradient-to-br from-purple-50 to-indigo-50 py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">CotizaBot para <span className="text-purple-600">Servicios Técnicos</span></h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Automatiza cotizaciones de plomería, electricidad e instalaciones. Tus clientes describen el trabajo y el bot les da un precio estimado.
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
            <h2 className="text-3xl font-bold text-center mb-12">Perfecto para técnicos y contratistas</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Cotiza servicios</h3>
                <p className="text-slate-600">Define tus servicios con precios base: instalación de contacto, cambio de llave, destape de drenaje, etc.</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Materiales incluidos</h3>
                <p className="text-slate-600">El bot puede incluir el costo de materiales en la cotización o mostrarlos por separado.</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">Agenda visitas</h3>
                <p className="text-slate-600">Después de cotizar, el bot puede preguntar fecha y hora para agendar el servicio.</p>
              </CardContent></Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Servicios que puedes cotizar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Plomería', 'Electricidad', 'Aire acondicionado', 'Impermeabilización', 'Tablaroca', 'Pintura', 'Carpintería', 'Herrería', 'Aluminio', 'Cancelería', 'Mantenimiento', 'Remodelaciones'].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-purple-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Profesionaliza tu negocio de servicios</h2>
            <p className="text-xl text-purple-100 mb-8">Cotiza como los grandes mientras te enfocas en hacer el trabajo</p>
            <Link to="/registro"><Button size="lg" className="bg-white text-purple-600 hover:bg-slate-50">Comenzar Ahora</Button></Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 CotizaExpress.com - CotizaBot para Servicios Técnicos</p>
        </div>
      </footer>
    </div>
  );
}
