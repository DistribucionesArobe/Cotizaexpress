/* Post-build: genera build/<ruta>/index.html con título, descripción, Open Graph
 * y contenido <noscript> propios de cada ruta, para que WhatsApp, Facebook,
 * Google y los robots de IA (que no ejecutan JavaScript) vean la página correcta.
 * La app de React arranca igual: es el mismo index.html con otro <head>.
 */
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '..', 'build');
const SRC = path.join(__dirname, '..', 'src', 'pages');
const SITE = 'https://cotizaexpress.com';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Extrae { slug: {metaTitle, metaDesc, h1} } de los objetos de datos de las páginas
function extraer(archivo) {
  const txt = fs.readFileSync(path.join(SRC, archivo), 'utf8');
  const out = {};
  const re = /\n  '?([a-z0-9-]+)'?:\s*\{([\s\S]*?)\n  \},/g;
  let m;
  while ((m = re.exec(txt))) {
    const bloque = m[2];
    const g = (k) => { const r = bloque.match(new RegExp(k + ":\\s*'((?:[^'\\\\]|\\\\.)*)'")); return r ? r[1].replace(/\\'/g, "'") : null; };
    if (g('metaTitle')) out[m[1]] = { title: g('metaTitle'), desc: g('metaDesc'), h1: g('h1') };
  }
  return out;
}

const USA_DESC = 'Haz tus estimates en dólares desde tu celular, en español, y revisa cuánto te queda antes de mandarlos. Labor y materiales separados, tax solo donde aplica, PDF en español o inglés. El primero es gratis.';

const RUTAS = {
  '/usa': {
    title: 'Estimates en Español para Contratistas Hispanos en USA — Revisa Cuánto te Queda | CotizaBot',
    desc: USA_DESC,
    locale: 'es_US',
    h1: 'Haz tu estimate y revisa cuánto te queda',
  },
  '/generador-de-cotizaciones': {
    title: 'Generador de Cotizaciones Gratis con IVA — Online y sin registro | CotizaExpress',
    desc: 'Crea cotizaciones profesionales gratis: captura como en Excel o pega la lista del cliente, calcula IVA, revisa tu ganancia estimada y descarga el PDF. Sin registro, desde tu celular.',
    h1: 'Haz una cotización profesional en 2 minutos',
  },
  '/precios': {
    title: 'Precios CotizaBot — Cotizador desde $299 MXN · Bot de WhatsApp $1,000 MXN',
    desc: 'Cotizador IA $299 MXN/mes (USA $15 USD). CotizaBot, el bot de WhatsApp que cotiza solo, $1,000 MXN/mes. CotizaBot Pro con cobros $2,000 MXN/mes. Primera cotización gratis.',
    h1: 'Planes y precios',
  },
};

const usa = extraer('OficioUSA.js');
for (const [slug, d] of Object.entries(usa)) RUTAS[`/usa/${slug}`] = { title: `${d.title} | CotizaBot`, desc: d.desc, locale: 'es_US', h1: d.h1 };
const cobrar = extraer('CuantoCobrar.js');
for (const [slug, d] of Object.entries(cobrar)) RUTAS[`/${slug}`] = { title: `${d.title} | CotizaExpress`, desc: d.desc, h1: d.h1 };
const oficioMx = extraer('CotizadorOficio.js');
for (const [slug, d] of Object.entries(oficioMx)) RUTAS[`/${slug}`] = { title: `${d.title} | CotizaExpress`, desc: d.desc, h1: d.h1 };

const base = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');

function reemplazar(html, ruta, m) {
  const url = SITE + ruta;
  const sets = [
    [/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`],
    [/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(m.desc)}"/>`],
    [/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}"/>`],
    [/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}"/>`],
    [/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(m.title)}"/>`],
    [/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(m.desc)}"/>`],
    [/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(m.title)}"/>`],
    [/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(m.desc)}"/>`],
  ];
  if (m.locale) sets.push([/<meta property="og:locale" content="[^"]*"\s*\/?>/, `<meta property="og:locale" content="${m.locale}"/>`]);
  let out = html;
  for (const [re, val] of sets) out = out.replace(re, val);
  // noscript propio de la ruta, antes del de la home
  out = out.replace('<noscript>', `<noscript><h1>${esc(m.h1 || m.title)}</h1><p>${esc(m.desc)}</p><p><a href="${SITE}/registro">Empezar gratis</a> · <a href="${SITE}/cotizabot.html">Qué es CotizaBot</a></p></noscript>\n<noscript>`);
  return out;
}

let n = 0;
for (const [ruta, m] of Object.entries(RUTAS)) {
  const dir = path.join(BUILD, ruta.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), reemplazar(base, ruta, m));
  n++;
}
console.log(`route-meta: ${n} rutas con metadatos propios`);
