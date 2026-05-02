import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Globe, Search, TrendingUp, ExternalLink,
  Monitor, RefreshCw
} from 'lucide-react';

const ADMIN_EMAILS = ['ealejandro.robledo@gmail.com'];

// Looker Studio embed URL — replace with your actual report URL
// To set up:
// 1. Go to lookerstudio.google.com
// 2. Create report → Add data → Search Console
// 3. Select cotizaexpress.com property
// 4. Build your dashboard (clicks, impressions, CTR, position by query/page)
// 5. File → Embed report → Copy URL
// 6. Paste below
const LOOKER_EMBED_URL = '';

// Direct links for quick access
const QUICK_LINKS = [
  {
    label: 'Search Console',
    url: 'https://search.google.com/search-console?resource_id=sc-domain:cotizaexpress.com',
    icon: Search,
    description: 'Rendimiento, cobertura, indexación',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    label: 'Google Analytics',
    url: 'https://analytics.google.com',
    icon: BarChart3,
    description: 'Tráfico, usuarios, conversiones',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    label: 'PageSpeed Insights',
    url: 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fcotizaexpress.com',
    icon: TrendingUp,
    description: 'Core Web Vitals, performance',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    label: 'Google Tag Manager',
    url: 'https://tagmanager.google.com',
    icon: Monitor,
    description: 'GTM-WXK53JGZ — eventos, tags',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

export default function AdminSEO() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-7 h-7 text-blue-600" />
              SEO & Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Rendimiento de cotizaexpress.com en búsqueda orgánica
            </p>
          </div>
          {LOOKER_EMBED_URL && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey(k => k + 1)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </Button>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-xl border p-4 hover:shadow-md transition-shadow ${link.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <link.icon className="w-5 h-5" />
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </div>
              <div className="font-semibold text-sm">{link.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{link.description}</div>
            </a>
          ))}
        </div>

        {/* Embedded Report or Setup Instructions */}
        {LOOKER_EMBED_URL ? (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Search Console — Reporte en vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                key={refreshKey}
                src={LOOKER_EMBED_URL}
                width="100%"
                height="800"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-redirect"
                title="Search Console Report"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Conectar Search Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm">
                Para ver tus métricas de Search Console directamente aquí, sigue estos pasos:
              </p>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                  <span>
                    Abre{' '}
                    <a href="https://lookerstudio.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Looker Studio
                    </a>{' '}
                    y crea un nuevo reporte
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Agrega la fuente de datos: <strong>Search Console</strong> → selecciona <code className="bg-slate-100 px-1 rounded">cotizaexpress.com</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Diseña tu dashboard: clicks, impresiones, CTR, posición promedio por query y por página</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
                  <span>
                    Archivo → <strong>Incorporar informe</strong> → Habilitar incorporación → Copia la URL
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">5</span>
                  <span>
                    Pega la URL en <code className="bg-slate-100 px-1 rounded">LOOKER_EMBED_URL</code> en este archivo y redeploy
                  </span>
                </li>
              </ol>
              <div className="pt-2">
                <a
                  href="https://lookerstudio.google.com/reporting/create?ds.connector=searchConsole&ds.siteUrl=sc-domain:cotizaexpress.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Crear reporte en Looker Studio
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Páginas indexadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {[
                { page: '/', label: 'Landing principal' },
                { page: '/calculadoras', label: 'Calculadoras (malla ciclónica)' },
                { page: '/ferreterias', label: 'Directorio ferreterías' },
                { page: '/precios', label: 'Precios' },
                { page: '/demo', label: 'Demo' },
              ].map(p => (
                <div key={p.page} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-medium text-slate-700">{p.label}</span>
                    <span className="text-xs text-slate-400 block">cotizaexpress.com{p.page}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
