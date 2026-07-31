import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import BLOG_POSTS from '../data/blogPosts';

export default function Blog() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Blog — Guías para vender más por WhatsApp | CotizaExpress</title>
        <meta name="description" content="Guías prácticas para negocios mexicanos: automatización de cotizaciones, WhatsApp Business, IVA, IA para PyMEs y más." />
        <link rel="canonical" href="https://cotizaexpress.com/blog" />
        <meta property="og:title" content="Blog de CotizaExpress — Guías para vender más por WhatsApp" />
        <meta property="og:url" content="https://cotizaexpress.com/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-cotizabot.png" alt="CotizaBot" className="h-14 w-auto" />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-slate-900">CotizaBot</span>
                <span className="text-xs text-slate-500 block -mt-1">by CotizaExpress.com</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/precios" className="text-slate-600 hover:text-emerald-600 font-medium hidden sm:block">Precios</Link>
              <Link to="/demo" className="text-slate-600 hover:text-emerald-600 font-medium hidden md:block">Demo</Link>
              <Link to="/login"><Button variant="ghost" className="text-slate-600">Iniciar Sesión</Button></Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Blog de CotizaExpress</h1>
        <p className="text-lg text-slate-600 mb-12">Guías prácticas para vender más por WhatsApp — sin tecnicismos, con ejemplos de negocios mexicanos.</p>

        <div className="space-y-6">
          {BLOG_POSTS.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readMin} min de lectura</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">{post.title}</h2>
                  <p className="text-slate-600">{post.description}</p>
                  <span className="inline-block mt-3 text-emerald-600 font-medium text-sm">Leer guía →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
