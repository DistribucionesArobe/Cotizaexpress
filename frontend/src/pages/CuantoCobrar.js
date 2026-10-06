import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const OFICIOS_COBRAR = {
  'cuanto-cobrar-por-pintar': {
    nombre: 'pintar',
    emoji: '🎨',
    h1: '¿Cuánto cobrar por pintar? (m², sqft y lo que todos olvidan)',
    metaTitle: '¿Cuánto Cobrar por Pintar? Guía en Español con Fórmula y Calculadora',
    metaDesc: 'Cuánto cobrar por pintar por m² o sqft: la fórmula completa (pintura, mano de obra, preparación, desperdicio) y los costos que casi todos olvidan. Con calculadora de ganancia.',
    unidad: 'm² / sqft',
    intro: 'La mayoría cobra por metro cuadrado (en México) o por pie cuadrado (en USA) — y la mayoría pierde dinero en el mismo lugar: no en la pintura ni en la mano de obra, sino en todo lo que no anotó.',
    olvidos: ['Preparación: resanar, lijar, tapar muebles y pisos (puede ser 20-30% del tiempo)', 'Sellador o primer cuando el muro lo pide', 'Desperdicio de pintura (5-10%)', 'Transporte y viáticos si la obra queda lejos', 'La segunda visita para detalles que siempre sale'],
    formula: 'Precio = (pintura + materiales de preparación) + (mano de obra × horas reales, con preparación) + transporte + desperdicio + TU margen (20-35%)',
    faq: [
      ['¿Cuánto se cobra por pintar un metro cuadrado?', 'Depende de tu ciudad, el estado del muro y si incluyes material. Lo importante no es copiar un número: es calcular TUS costos completos (pintura, preparación, transporte, desperdicio) y sumarle tu margen. Un precio copiado de internet puede hacerte perder dinero en tu zona.'],
      ['¿Qué incluyo en una cotización de pintura?', 'Metros o pies cuadrados, número de manos, si incluye material, preparación de superficie, y el desglose de mano de obra y materiales. Un desglose claro evita regateos y malentendidos.'],
      ['¿Cómo sé si un trabajo de pintura me conviene?', 'Resta tus costos reales del precio que vas a cobrar. Si el margen queda abajo del 20%, casi siempre es porque faltó contar preparación, transporte o la segunda visita. El Cotizador de CotizaExpress te lo calcula solo con el modo "¿Cuánto me queda?".'],
    ],
  },
  'cuanto-cobrar-por-drywall': {
    nombre: 'drywall / tablaroca',
    emoji: '🧱',
    h1: '¿Cuánto cobrar por drywall o tablaroca? (por m², sqft o por hoja)',
    metaTitle: '¿Cuánto Cobrar por Drywall o Tablaroca? Guía en Español con Fórmula',
    metaDesc: 'Cuánto cobrar por instalar drywall o tablaroca: por m², sqft o por hoja. La fórmula completa con material, acabado, texture y los costos que casi todos olvidan.',
    unidad: 'm² / sqft / hoja',
    intro: 'En drywall se cotiza por metro cuadrado, pie cuadrado o por hoja — y el nivel de acabado (desde hang hasta nivel 5 con texture) cambia todo el precio. El error más caro: cotizar el acabado fino a precio de acabado sencillo.',
    olvidos: ['El nivel de acabado: taping nivel 2 no cuesta lo mismo que nivel 4-5 con texture', 'Pijas, cinta, pasta y esquineros (se van sumando)', 'Desperdicio de hojas en cortes (10-15%)', 'Andamios o escalera para plafones altos', 'Retiro de escombro y limpieza'],
    formula: 'Precio = (hojas + pasta/cinta/pijas + esquineros) + (mano de obra por nivel de acabado) + desperdicio + retiro de escombro + TU margen (20-35%)',
    faq: [
      ['¿Cuánto se cobra por instalar tablaroca por metro cuadrado?', 'Varía por ciudad y por nivel de acabado. Más útil que copiar un número: calcula hojas + consumibles + tu mano de obra real por nivel, suma desperdicio y margen. Así tu precio aguanta cualquier zona.'],
      ['¿Qué nivel de acabado debo cotizar?', 'Pregunta siempre qué va encima: pintura lisa exige nivel 4-5; azulejo o texture pesado perdona nivel 2. Cotizar sin preguntar es el error clásico que se come la ganancia.'],
      ['¿Cómo presento la cotización a una constructora o contratista general?', 'Con desglose por concepto, folio y PDF formal — es el formato que esperan. El Cotizador de CotizaExpress lo genera en segundos, en español o inglés.'],
    ],
  },
  'cuanto-cobrar-por-instalar-piso': {
    nombre: 'instalar piso',
    emoji: '🪵',
    h1: '¿Cuánto cobrar por instalar piso? (vinílico, laminado, cerámico)',
    metaTitle: '¿Cuánto Cobrar por Instalar Piso? Guía en Español: Vinílico, Laminado y Cerámico',
    metaDesc: 'Cuánto cobrar por instalar piso vinílico, laminado o cerámico por m² o sqft: fórmula completa con preparación de superficie, desperdicio y los costos que casi todos olvidan.',
    unidad: 'm² / sqft',
    intro: 'El piso se cobra por metro o pie cuadrado, pero el dinero se gana (o se pierde) en la preparación: un contrapiso desnivelado o húmedo convierte un trabajo de 2 días en uno de 4 — al mismo precio, si no lo cotizaste.',
    olvidos: ['Preparación del contrapiso: autonivelante, primer, limpieza (revísalo ANTES de cotizar)', 'Desperdicio por cortes (8-12%, más en diagonal o espacios irregulares)', 'Molduras, zoclos y transiciones entre pisos', 'Retirar el piso viejo y el escombro', 'Mover muebles o electrodomésticos'],
    formula: 'Precio = (piso + autonivelante/adhesivo + zoclos y transiciones) + (mano de obra con preparación incluida) + desperdicio + retiro del piso viejo + TU margen (20-35%)',
    faq: [
      ['¿Cuánto se cobra por instalar piso vinílico por metro cuadrado?', 'Depende de tu zona y del estado del contrapiso. La clave es visitar antes de cotizar: la preparación de superficie es lo que más cambia el costo, y es justo lo que no se ve en una foto.'],
      ['¿Cobro distinto el piso cerámico que el vinílico?', 'Sí: el cerámico lleva más tiempo (adhesivo, separadores, boquilla, cortes con máquina) y suele cobrarse más caro por m². Cada tipo de piso debe tener su propia tarifa en tu lista de precios.'],
      ['¿Cómo evito perder dinero en un trabajo de piso?', 'Cuenta TODO: preparación, desperdicio, zoclos, retiro del piso viejo. Con el modo "¿Cuánto me queda?" del Cotizador pones tus costos por renglón y ves tu ganancia antes de mandar el precio.'],
    ],
  },
  'cuanto-cobrar-por-un-techo': {
    nombre: 'techos / roofing',
    emoji: '🏠',
    h1: '¿Cuánto cobrar por un techo? (roofing por square, m² o lámina)',
    metaTitle: '¿Cuánto Cobrar por un Techo? Guía de Roofing en Español con Fórmula',
    metaDesc: 'Cuánto cobrar por un techo: roofing por square en USA o por m²/lámina en México. Fórmula completa con tear-off, disposal, pendiente y los costos que casi todos olvidan.',
    unidad: 'square / m² / lámina',
    intro: 'En USA el roofing se cobra por square (100 sqft); en México por m² o por lámina. En los dos lados el dinero se pierde igual: en el tear-off, el disposal y la pendiente que nadie midió antes de dar el precio.',
    olvidos: ['Tear-off: quitar el techo viejo y el disposal (renta de contenedor)', 'La pendiente: un techo empinado tarda más y paga más', 'Underlayment, flashing, caballete y tornillería', 'Clima: días perdidos por lluvia que igual cuestan', 'Seguro y equipo de seguridad (allá los piden las aseguradoras)'],
    formula: 'Precio = (material por square/m² + underlayment + flashing + tornillería) + (mano de obra según pendiente) + tear-off y disposal + TU margen (25-40% — el techo es de los oficios con más riesgo)',
    faq: [
      ['¿Cuánto se cobra por un square de roofing?', 'Varía mucho por estado, material (shingle, metal, teja) y pendiente. En vez de copiar un rango: calcula material + labor según pendiente + tear-off + disposal, y súmale margen de 25-40%. El techo castiga los precios copiados.'],
      ['¿Qué debe incluir un estimate de roofing?', 'Squares o m², material, si incluye tear-off y disposal, underlayment y flashing, y el desglose de labor y materiales. Para trabajos de aseguradora, el folio y el desglose formal son obligatorios.'],
      ['¿Cómo mando un estimate profesional de roofing en español?', 'Con CotizaExpress describes el trabajo y sale el estimate en dólares o pesos, con PDF en español o inglés, listo para el cliente o el adjuster.'],
    ],
  },
};

function MiniCalc({ unidad }) {
  const [cobro, setCobro] = useState('');
  const [costo, setCosto] = useState('');
  const c = parseFloat(cobro) || 0;
  const g = c - (parseFloat(costo) || 0);
  const m = c > 0 ? (g / c) * 100 : 0;
  return (
    <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-5 my-8">
      <p className="font-bold text-slate-900 mb-3">💰 Calculadora rápida: ¿cuánto te queda?</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm text-slate-700">Lo que vas a cobrar (antes de IVA/tax)
          <input type="number" value={cobro} onChange={e => setCobro(e.target.value)} placeholder="Ej: 15000" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white" />
        </label>
        <label className="text-sm text-slate-700">Lo que te cuesta (material + cuadrilla + extras)
          <input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="Ej: 9800" className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white" />
        </label>
      </div>
      {c > 0 && (
        <p className={`font-bold ${g >= 0 && m >= 20 ? 'text-emerald-700' : 'text-red-600'}`}>
          {g >= 0 ? `Ganancia estimada: $${g.toLocaleString('es-MX')} (${m.toFixed(0)}% de margen)` : `⚠️ Pérdida estimada: $${Math.abs(g).toLocaleString('es-MX')}`}
          {g >= 0 && m < 20 && ' — ⚠️ abajo del 20%: revisa si contaste preparación, transporte, desperdicio y segunda visita.'}
        </p>
      )}
      <p className="text-xs text-slate-500 mt-2">Usa la venta antes de impuesto: el IVA o tax que cobras no es tuyo. El Cotizador hace esto renglón por renglón, con tu PDF profesional incluido.</p>
    </div>
  );
}

export default function CuantoCobrar({ slug }) {
  const o = OFICIOS_COBRAR[slug];
  if (!o) return <Navigate to="/" replace />;
  const url = `https://cotizaexpress.com/${slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: o.h1,
      inLanguage: 'es',
      author: { '@type': 'Organization', name: 'CotizaExpress' },
      publisher: { '@type': 'Organization', name: 'CotizaExpress' },
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: o.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{o.metaTitle} | CotizaExpress</title>
        <meta name="description" content={o.metaDesc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={o.metaTitle} />
        <meta property="og:description" content={o.metaDesc} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-emerald-200 flex-shrink-0">🤖</div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CotizaBot</span>
          </Link>
          <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Cotizar gratis</Button></Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-4xl mb-3 text-center">{o.emoji}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-center leading-tight">{o.h1}</h1>
        <p className="text-lg text-slate-600 mb-8 text-center">{o.intro}</p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">La fórmula completa ({o.unidad})</p>
          <p className="text-slate-800 font-medium">{o.formula}</p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-3">Lo que casi todos olvidan cobrar</h2>
        <p className="text-slate-600 mb-3">Aquí es donde se pierde el dinero — no en el precio por {o.unidad}, sino en lo que no se anotó:</p>
        <ul className="space-y-2 mb-4">
          {o.olvidos.map((x, i) => (
            <li key={i} className="flex gap-2 text-slate-700"><span className="text-red-500 font-bold">✗</span><span>{x}</span></li>
          ))}
        </ul>
        <p className="text-slate-600 mb-2">Cada punto de esa lista parece chico. Juntos, son la diferencia entre un trabajo que deja 30% y uno donde trabajaste de a gratis.</p>

        <MiniCalc unidad={o.unidad} />

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center text-white mb-10">
          <p className="text-xl font-bold mb-2">Haz tu cotización de {o.nombre} con todo contado</p>
          <p className="text-emerald-50 text-sm mb-4">
            El Cotizador separa materiales y mano de obra, calcula el impuesto, genera el PDF con tu logo —
            y con el modo "¿Cuánto me queda?" ves tu ganancia antes de mandar el precio. La primera es gratis.
          </p>
          <Link to={`/registro?utm_source=${slug}`}>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8">Hacer mi cotización gratis →</Button>
          </Link>
          <p className="text-xs text-emerald-100 mt-3">🇺🇸 ¿Trabajas en USA? <Link to="/usa" className="underline">Estimates en dólares, con tax, en español →</Link></p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-4">Preguntas frecuentes</h2>
        <div className="space-y-3 mb-10">
          {o.faq.map(([q, a]) => (
            <details key={q} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <summary className="font-semibold text-slate-800 cursor-pointer">{q}</summary>
              <p className="text-sm text-slate-600 mt-2">{a}</p>
            </details>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">También te puede servir:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(OFICIOS_COBRAR).filter(([s]) => s !== slug).map(([s, x]) => (
              <Link key={s} to={`/${s}`} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 text-sm font-medium rounded-full px-4 py-2">
                {x.emoji} ¿Cuánto cobrar por {x.nombre}?
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
