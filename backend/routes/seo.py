"""
CotizaBot - SEO Routes (sitemap.xml, robots.txt)
"""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from datetime import datetime

router = APIRouter(tags=["SEO"])

DOMAIN = "https://cotizaexpress.com"

# Rutas públicas para el sitemap
SEO_ROUTES = [
    {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
    {"loc": "/precios", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "/demo", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/ferreterias", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/refaccionarias", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/servicios-tecnicos", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/registro", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/privacidad", "priority": "0.3", "changefreq": "yearly"},
    {"loc": "/terminos", "priority": "0.3", "changefreq": "yearly"},
]


@router.get("/sitemap.xml", response_class=PlainTextResponse)
async def sitemap():
    """Genera el sitemap.xml para SEO"""
    lastmod = datetime.now().strftime("%Y-%m-%d")
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for route in SEO_ROUTES:
        xml_content += "  <url>\n"
        xml_content += f"    <loc>{DOMAIN}{route['loc']}</loc>\n"
        xml_content += f"    <lastmod>{lastmod}</lastmod>\n"
        xml_content += f"    <changefreq>{route['changefreq']}</changefreq>\n"
        xml_content += f"    <priority>{route['priority']}</priority>\n"
        xml_content += "  </url>\n"
    
    xml_content += "</urlset>"
    
    return PlainTextResponse(content=xml_content, media_type="application/xml")


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    """Genera el robots.txt para SEO"""
    content = f"""User-agent: *
Allow: /
Allow: /precios
Allow: /demo
Allow: /ferreterias
Allow: /refaccionarias
Allow: /servicios-tecnicos
Allow: /privacidad
Allow: /terminos
Allow: /registro

Disallow: /login
Disallow: /dashboard
Disallow: /cotizaciones
Disallow: /productos
Disallow: /clientes
Disallow: /conversaciones
Disallow: /configuracion-whatsapp
Disallow: /config-cobros
Disallow: /perfil-empresa
Disallow: /admin
Disallow: /portal/
Disallow: /api/

Sitemap: {DOMAIN}/sitemap.xml
"""
    return PlainTextResponse(content=content, media_type="text/plain")
