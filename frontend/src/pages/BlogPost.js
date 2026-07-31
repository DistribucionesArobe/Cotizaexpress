import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Link, useParams, Navigate } from 'react-router-dom';
import BLOG_POSTS from '../data/blogPosts';

export default function BlogPost() {
  const { postSlug } = useParams();
  const post = BLOG_POSTS.find(p => p.slug === postSlug);

  if (!post) return <Navigate to="/blog" replace />;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'CotizaExpress' },
    publisher: { '@type': 'Organization', name: 'CotizaExpress', url: 'https://cotizaexpress.com' },
    mainEntityOfPage: `https://cotizaexpress.com/blog/${post.slug}`,
  };

  const otherPosts = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{post.title} | CotizaExpress</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://cotizaexpress.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={`https://cotizaexpress.com/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
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
              <Link to="/blog" className="text-slate-600 hover:text-emerald-600 font-medium hidden sm:block">Blog</Link>
              <Link to="/precios" className="text-slate-600 hover:text-emerald-600 font-medium hidden sm:block">Precios</Link>
              <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/blog" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">← Todas las guías</Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-3 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-10">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readMin} min de lectura</span>
          <span>·</span>
          <span>CotizaExpress</span>
        </div>

        <article
          className="prose prose-slate prose-lg max-w-none
                     [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-10 [&_h2]:mb-4
                     [&_p]:text-slate-600 [&_p]:leading-relaxed [&_p]:mb-4
                     [&_a]:text-emerald-600 [&_a]:font-medium [&_strong]:text-slate-800"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-14 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">¿Listo para cotizar en 3 segundos?</h3>
          <p className="text-emerald-100 mb-6">Prueba CotizaBot gratis — manda "DEMO" a nuestro WhatsApp.</p>
          <a href="https://wa.me/5218342472640?text=DEMO" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">Probar Demo Gratis</Button>
          </a>
        </div>

        {/* Más guías */}
        <div className="mt-14">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Más guías</h3>
          <div className="space-y-3">
            {otherPosts.map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="block text-emerald-600 hover:text-emerald-700 font-medium">
                {p.title} →
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
