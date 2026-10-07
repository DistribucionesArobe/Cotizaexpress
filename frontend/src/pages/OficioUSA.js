import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const OFICIOS_USA = {
  roofing: {
    nombre: 'roofing',
    emoji: '🏠',
    h1: 'Estimates de roofing en español',
    sub: 'Shingles, underlayment, flashing y labor — todo en un estimate profesional en dólares, con tax, listo para mandarlo por texto antes de bajarte del techo.',
    ejemplo: 'Reemplazo de techo 22 squares, shingles arquitectónicos, incluye tear-off y disposal',
    metaTitle: 'Estimates de Roofing en Español — App para Roofers Hispanos en USA',
    metaDesc: 'Haz estimates de roofing en dólares desde tu celular, en español: materiales, labor y tax en un PDF profesional. $29/mes, el primero gratis.',
    bullets: ['Cotiza por square con material y labor separados', 'Tax solo a lo que lo lleva: material, y labor si tu estado lo pide', 'PDF con tu logo que te hace ver como compañía grande'],
    faq: [
      ['¿Cómo hago un estimate de roofing en español?', 'Escribe el trabajo en tus palabras — "reemplazo de techo 22 squares con tear-off" — y CotizaBot lo convierte en un estimate en dólares con labor, materiales, tax y PDF profesional, todo en español.'],
      ['¿Puedo separar labor y materiales en el estimate?', 'Sí. Cada línea se marca como material o labor (mano de obra) y el PDF muestra el desglose, que es lo que el cliente y las aseguradoras quieren ver.'],
      ['¿Sirve para trabajos de aseguranza (insurance claims)?', 'El PDF trae folio, desglose de conceptos y totales con tax — el formato que piden los adjusters. Tú pones los precios de tu área.'],
    ],
  },
  landscaping: {
    nombre: 'landscaping',
    emoji: '🌳',
    h1: 'Estimates de landscaping en español',
    sub: 'Mowing, mulch, sod, irrigación y labor — manda el estimate en dólares desde tu teléfono, en español, antes que los demás landscapers.',
    ejemplo: 'Instalar sod 1,200 sqft, 5 yardas de mulch, recortar 3 árboles, limpieza general',
    metaTitle: 'Estimates de Landscaping en Español — App para Landscapers Hispanos en USA',
    metaDesc: 'Haz estimates de landscaping y lawn care en dólares desde tu celular, en español: sod, mulch, labor y tax en un PDF profesional. $29/mes, el primero gratis.',
    bullets: ['Cotiza por sqft, por yarda o por servicio', 'Estimates recurrentes en segundos (mowing semanal)', 'El primero que manda precio se queda el trabajo'],
    faq: [
      ['¿Cómo hago un estimate de landscaping en español?', 'Describe el trabajo — "instalar sod 1,200 sqft y 5 yardas de mulch" — y CotizaBot arma el estimate en dólares con materiales, labor y tax, en español y con PDF profesional.'],
      ['¿Puedo cotizar servicios recurrentes como mowing?', 'Sí, guardas tus precios una vez (por corte, por sqft, por visita) y cada estimate nuevo sale en segundos desde tu celular.'],
      ['¿El estimate sale en dólares con tax?', 'Sí, todo en USD y tú pones la tasa de sales tax que aplica a tu caso — varía por estado, localidad y tipo de servicio — o la dejas en cero.'],
    ],
  },
  painting: {
    nombre: 'painting',
    emoji: '🎨',
    h1: 'Estimates de painting en español',
    sub: 'Por sqft o por cuarto, con pintura y labor desglosados — un estimate en dólares con tu logo, en español, en 2 minutos.',
    ejemplo: 'Pintar interior 1,800 sqft, 2 manos, incluye primer y material, paredes y techos',
    metaTitle: 'Estimates de Painting en Español — App para Pintores Hispanos en USA',
    metaDesc: 'Haz estimates de pintura en dólares desde tu celular, en español: sqft, pintura, labor y tax en un PDF profesional. $29/mes, el primero gratis.',
    bullets: ['Cotiza por sqft con material incluido o sin él', 'Labor y pintura separados, como lo pide el cliente', 'PDF profesional que gana contra el estimate escrito a mano'],
    faq: [
      ['¿Cómo hago un estimate de pintura en español?', 'Escribe el trabajo — "pintar interior 1,800 sqft, 2 manos con material" — y CotizaBot lo convierte en estimate en dólares con desglose, tax y PDF en español.'],
      ['¿Cuánto cobrar por pintar en USA?', 'Los precios varían por ciudad y estado; tú guardas TUS precios por sqft o por cuarto una vez, y la app los usa en cada estimate nuevo.'],
      ['¿Puedo mandar el estimate por texto o WhatsApp?', 'Sí, cada estimate genera un link y un PDF que mandas por mensaje de texto, WhatsApp o email desde tu celular.'],
    ],
  },
  remodeling: {
    nombre: 'remodeling',
    emoji: '🔨',
    h1: 'Estimates de remodeling en español',
    sub: 'Kitchen, baño, basement o la casa entera — estimates en dólares con materiales y labor desglosados, en español y con PDF profesional.',
    ejemplo: 'Remodelación de baño completo: demolición, tile 120 sqft, vanity, plomería y labor',
    metaTitle: 'Estimates de Remodeling en Español — App para Remodeladores Hispanos en USA',
    metaDesc: 'Haz estimates de remodelación en dólares desde tu celular, en español: demolición, materiales, labor y tax en un PDF profesional. $29/mes, el primero gratis.',
    bullets: ['Proyectos grandes con muchos conceptos, sin complicarte', 'Desglose claro = menos regateo del cliente', 'Te ves como contratista general aunque estés empezando'],
    faq: [
      ['¿Cómo hago un estimate de remodelación en español?', 'Pega la lista del proyecto — demolición, tile, vanity, labor — y CotizaBot arma el estimate completo en dólares con tax y PDF profesional en español.'],
      ['¿Sirve para proyectos grandes con muchas líneas?', 'Sí, puedes meter todas las líneas que necesites, editarlas en una tabla y marcar cada una como material o labor antes de generar el PDF.'],
      ['¿Mi cliente puede ver el estimate en su teléfono?', 'Sí, le mandas un link o el PDF directo por texto, WhatsApp o email — se ve profesional en cualquier teléfono.'],
    ],
  },
  handyman: {
    nombre: 'handyman',
    emoji: '🔧',
    h1: 'Estimates de handyman en español',
    sub: 'Trabajos chicos, muchos al día — haz cada estimate en 2 minutos en dólares, con tax, y mándalo antes de llegar al siguiente trabajo.',
    ejemplo: 'Instalar ceiling fan, reparar drywall 2 hoyos, pintar puerta, cambiar llave de cocina',
    metaTitle: 'Estimates de Handyman en Español — App para Handymen Hispanos en USA',
    metaDesc: 'Haz estimates de handyman en dólares desde tu celular, en español: lista de trabajos, labor, tax y PDF profesional en 2 minutos. $29/mes, el primero gratis.',
    bullets: ['Varios trabajos en un mismo estimate', 'Rápido: lo haces entre un trabajo y el siguiente', 'Precio formal por escrito = te pagan lo justo'],
    faq: [
      ['¿Cómo hago un estimate de handyman en español?', 'Escribe la lista de trabajos — "instalar ceiling fan, reparar drywall, cambiar llave" — y CotizaBot arma el estimate en dólares con cada concepto, tax y PDF en español.'],
      ['¿Me sirve si cobro por hora?', 'Sí, agregas una línea de labor con tus horas y tu tarifa, y el total con tax sale solo.'],
      ['¿Necesito computadora?', 'No, todo es desde tu celular y se instala como app. En español y sin programas raros.'],
    ],
  },
  drywall: {
    nombre: 'drywall',
    emoji: '🧱',
    h1: 'Estimates de drywall en español',
    sub: 'Hanging, taping, texture y labor por sqft — el estimate en dólares con tax sale en 2 minutos desde tu celular, en español.',
    ejemplo: 'Hang y finish de drywall 2,400 sqft, nivel 4, incluye material y texture knockdown',
    metaTitle: 'Estimates de Drywall en Español — App para Drywalleros Hispanos en USA',
    metaDesc: 'Haz estimates de drywall en dólares desde tu celular, en español: sqft, material, labor y tax en un PDF profesional. $29/mes, el primero gratis.',
    bullets: ['Cotiza por sqft o por board', 'Hanging, taping y texture como líneas separadas', 'PDF con folio para constructoras y contratistas generales'],
    faq: [
      ['¿Cómo hago un estimate de drywall en español?', 'Describe el trabajo — "hang y finish 2,400 sqft nivel 4 con texture" — y CotizaBot lo convierte en estimate en dólares con desglose, tax y PDF profesional.'],
      ['¿Sirve para trabajar con constructoras y contratistas generales?', 'Sí, el PDF con folio y desglose por concepto es el formato que los contratistas generales esperan — te toman más en serio que con un número hablado.'],
      ['¿Puedo cotizar solo labor sin material?', 'Sí, marcas cada línea como labor o material; si el contratista general pone el material, tu estimate sale solo con labor.'],
    ],
  },
  flooring: {
    nombre: 'flooring / pisos',
    emoji: '🪵',
    h1: 'Estimates de flooring en español',
    sub: 'Vinyl, laminate, tile o madera — con preparación del subfloor, molduras y labor por sqft. El estimate en dólares sale en 2 minutos desde tu celular.',
    ejemplo: 'Instalar LVP 650 sqft, quitar alfombra vieja, autonivelante en cocina, baseboards nuevos',
    metaTitle: 'Estimates de Flooring en Español — App para Instaladores de Piso Hispanos en USA',
    metaDesc: 'Haz estimates de flooring en dólares desde tu celular, en español: vinyl, laminate, tile, preparación del subfloor y labor en un PDF profesional. El primero gratis.',
    bullets: ['Cotiza por sqft con material y labor separados', 'Preparación del subfloor como renglón aparte (ahí se pierde el dinero)', 'PDF en inglés si tu cliente lo pide'],
    faq: [
      ['¿Cómo hago un estimate de flooring en español?', 'Escribe el trabajo — "instalar LVP 650 sqft, quitar alfombra y autonivelante" — y CotizaBot arma el estimate en dólares con material, preparación y labor separados, con PDF profesional.'],
      ['¿Cómo no perder dinero en la preparación del piso?', 'Pon el autonivelante, el primer y el retiro del piso viejo como renglones aparte, y revisa tu ganancia estimada con "¿Cuánto me queda?" antes de mandar el precio.'],
      ['¿Le cobro tax a la labor de instalación?', 'Depende de tu estado y del tipo de trabajo. CotizaBot te deja cobrar tax solo al material o también a la labor, según la regla que te aplique.'],
    ],
  },
  cleaning: {
    nombre: 'cleaning / limpieza',
    emoji: '🧽',
    h1: 'Estimates de cleaning en español',
    sub: 'Limpieza residencial, comercial, move-out o post-construcción — por visita, por hora o por sqft. Manda el estimate en dólares antes que la competencia.',
    ejemplo: 'Deep cleaning casa 2,200 sqft, 3 baños, adentro del refrigerador y horno, move-out',
    metaTitle: 'Estimates de Cleaning en Español — App para Negocios de Limpieza Hispanos en USA',
    metaDesc: 'Haz estimates de limpieza en dólares desde tu celular, en español: residencial, comercial, move-out y post-construcción, por visita, hora o sqft. El primero gratis.',
    bullets: ['Por visita, por hora o por sqft', 'Servicios extra (horno, refri, ventanas) como renglones', 'Estimates recurrentes en segundos'],
    faq: [
      ['¿Cómo hago un estimate de limpieza en español?', 'Describe el servicio — "deep cleaning 2,200 sqft con 3 baños y move-out" — y CotizaBot lo convierte en un estimate en dólares con cada servicio separado y PDF profesional.'],
      ['¿Cómo cobro los extras de limpieza?', 'Ponlos como renglones aparte (horno, refrigerador, ventanas, paredes). Así el cliente ve qué paga y no regatea el precio base.'],
      ['¿Sirve para limpieza comercial y post-construcción?', 'Sí. Puedes cotizar por sqft, por visita o por hora, y mandar el estimate en inglés si el cliente o el general contractor lo pide.'],
    ],
  },
  concrete: {
    nombre: 'concrete / concreto',
    emoji: '🏗️',
    h1: 'Estimates de concrete en español',
    sub: 'Banquetas, patios, driveways, losas — con yardas de concreto, cimbra, malla, bombeo y labor separados. Estimate en dólares desde tu celular.',
    ejemplo: 'Driveway 20x40 ft, 4 pulgadas, malla de acero, demoler concreto viejo, acabado broom finish',
    metaTitle: 'Estimates de Concrete en Español — App para Contratistas de Concreto Hispanos en USA',
    metaDesc: 'Haz estimates de concreto en dólares desde tu celular, en español: yardas, cimbra, malla, bombeo, demolición y labor en un PDF profesional. El primero gratis.',
    bullets: ['Yardas, cimbra, malla y bombeo como renglones', 'Demolición y retiro de escombro aparte', 'Revisa tu ganancia antes de mandar el precio'],
    faq: [
      ['¿Cómo hago un estimate de concreto en español?', 'Escribe el trabajo — "driveway 20x40, 4 pulgadas, malla y demolición" — y CotizaBot arma el estimate en dólares con material, renta de equipo y labor separados.'],
      ['¿Qué se me olvida cobrar en un trabajo de concreto?', 'Lo típico: bombeo, demolición, retiro de escombro, cimbra y el desperdicio de concreto. Ponlos como renglones y revisa tu ganancia estimada con "¿Cuánto me queda?".'],
      ['¿Puedo mandar el estimate en inglés?', 'Sí. Trabajas en español y eliges que el PDF salga en inglés para el cliente o el general contractor.'],
    ],
  },
  fencing: {
    nombre: 'fencing / cercas',
    emoji: '🚧',
    h1: 'Estimates de fencing en español',
    sub: 'Cercas de madera, vinyl, chain link o hierro — por pie lineal, con postes, concreto, puertas y labor separados. El estimate en dólares en 2 minutos.',
    ejemplo: 'Cerca de madera cedar 6 ft, 180 pies lineales, 2 puertas, quitar cerca vieja',
    metaTitle: 'Estimates de Fencing en Español — App para Contratistas de Cercas Hispanos en USA',
    metaDesc: 'Haz estimates de cercas en dólares desde tu celular, en español: madera, vinyl, chain link, por pie lineal, con postes, puertas y labor. El primero gratis.',
    bullets: ['Por pie lineal con postes y concreto incluidos', 'Puertas y retiro de cerca vieja como renglones', 'PDF profesional en español o inglés'],
    faq: [
      ['¿Cómo hago un estimate de cercas en español?', 'Describe el trabajo — "cerca cedar 6 ft, 180 pies lineales, 2 puertas" — y CotizaBot lo convierte en un estimate en dólares con material y labor separados.'],
      ['¿Cómo cotizo por pie lineal?', 'Pon tu precio por pie lineal como un renglón y las puertas, postes extra y retiro de cerca vieja aparte. El total y el tax salen solos.'],
      ['¿Me dice cuánto le gano?', 'Sí, como estimación: con "¿Cuánto me queda?" pones tu costo de material y cuadrilla y ves tu ganancia antes de mandar el precio.'],
    ],
  },
  plumbing: {
    nombre: 'plumbing / plomería',
    emoji: '🚰',
    h1: 'Estimates de plumbing en español',
    sub: 'Reparaciones, water heaters, baños nuevos, re-piping — partes y labor separados, con tu tarifa por hora o por trabajo. Estimate en dólares desde tu celular.',
    ejemplo: 'Cambiar water heater 50 gal, válvulas nuevas, permiso de la ciudad, retirar el viejo',
    metaTitle: 'Estimates de Plumbing en Español — App para Plomeros Hispanos en USA',
    metaDesc: 'Haz estimates de plomería en dólares desde tu celular, en español: partes, labor por hora o por trabajo, permisos y PDF profesional. El primero gratis.',
    bullets: ['Partes y labor separados', 'Permisos y retiro de equipo viejo como renglones', 'Cobra por hora o por trabajo'],
    faq: [
      ['¿Cómo hago un estimate de plomería en español?', 'Escribe el trabajo — "cambiar water heater 50 gal con permiso" — y CotizaBot arma el estimate en dólares con partes, labor y permisos separados.'],
      ['¿Puedo cobrar por hora?', 'Sí: agregas un renglón de labor con tus horas y tu tarifa, y el total sale solo.'],
      ['¿Y si el cliente pide algo extra a mitad del trabajo?', 'Haces una orden de cambio sobre el estimate original y el cliente la aprueba desde su celular antes de que hagas el extra.'],
    ],
  },
  electrical: {
    nombre: 'electrical / electricidad',
    emoji: '💡',
    h1: 'Estimates de electrical en español',
    sub: 'Contactos, lámparas, paneles, circuitos nuevos — material y labor separados, con permisos. El estimate en dólares sale desde tu celular en 2 minutos.',
    ejemplo: 'Instalar 6 recessed lights, 2 circuitos nuevos 20A, cambiar 10 contactos a GFCI',
    metaTitle: 'Estimates de Electrical en Español — App para Electricistas Hispanos en USA',
    metaDesc: 'Haz estimates eléctricos en dólares desde tu celular, en español: material, labor, permisos y PDF profesional en español o inglés. El primero gratis.',
    bullets: ['Material y labor por renglón', 'Permisos e inspección aparte', 'PDF en inglés para el cliente o el GC'],
    faq: [
      ['¿Cómo hago un estimate eléctrico en español?', 'Describe el trabajo — "6 recessed lights y 2 circuitos nuevos" — y CotizaBot arma el estimate en dólares con material y labor separados y PDF profesional.'],
      ['¿Puedo poner los permisos en el estimate?', 'Sí, como renglón aparte, para que el cliente vea qué paga y no lo tomes de tu ganancia.'],
      ['¿Necesito computadora?', 'No. Todo es desde el celular, en español, y se instala como app.'],
    ],
  },
  hvac: {
    nombre: 'HVAC / aire acondicionado',
    emoji: '❄️',
    h1: 'Estimates de HVAC en español',
    sub: 'Equipos nuevos, mantenimiento, ductos, mini splits — equipo, material y labor separados. Manda el estimate en dólares antes de salir de la casa.',
    ejemplo: 'Instalar mini split 24,000 BTU, línea de 25 ft, base y desagüe, retirar unidad de ventana',
    metaTitle: 'Estimates de HVAC en Español — App para Técnicos de Aire Acondicionado Hispanos en USA',
    metaDesc: 'Haz estimates de HVAC en dólares desde tu celular, en español: equipo, material, labor y permisos en un PDF profesional. El primero gratis.',
    bullets: ['Equipo, material y labor por separado', 'Mantenimientos recurrentes en segundos', 'Revisa tu ganancia antes de mandar el precio'],
    faq: [
      ['¿Cómo hago un estimate de HVAC en español?', 'Escribe el trabajo — "instalar mini split 24,000 BTU con línea de 25 ft" — y CotizaBot arma el estimate en dólares con equipo, material y labor separados.'],
      ['¿Cómo sé si el trabajo me conviene?', 'Pon tu costo del equipo y la cuadrilla en "¿Cuánto me queda?" y ves tu ganancia estimada antes de mandar el precio.'],
      ['¿Puedo mandarlo en inglés?', 'Sí, el PDF puede salir en inglés aunque tú trabajes en español.'],
    ],
  },
  tile: {
    nombre: 'tile / azulejo',
    emoji: '🔲',
    h1: 'Estimates de tile en español',
    sub: 'Baños, cocinas, backsplash, pisos de cerámica — material, preparación, boquilla y labor por sqft. El estimate en dólares sale desde tu celular.',
    ejemplo: 'Regadera completa, tile 12x24 en paredes 90 sqft, piso 40 sqft, nicho, membrana impermeable',
    metaTitle: 'Estimates de Tile en Español — App para Instaladores de Azulejo Hispanos en USA',
    metaDesc: 'Haz estimates de tile en dólares desde tu celular, en español: material, membrana, boquilla, preparación y labor por sqft en un PDF profesional. El primero gratis.',
    bullets: ['Por sqft con material y labor separados', 'Membrana, nichos y cortes especiales como renglones', 'PDF profesional en español o inglés'],
    faq: [
      ['¿Cómo hago un estimate de tile en español?', 'Describe el trabajo — "regadera completa con tile 12x24 y nicho" — y CotizaBot arma el estimate en dólares con material, preparación y labor separados.'],
      ['¿Qué se olvida cobrar en un trabajo de azulejo?', 'La membrana impermeable, los nichos, los cortes en diagonal, la demolición y el desperdicio. Ponlos como renglones aparte.'],
      ['¿Le cobro tax a la labor?', 'Depende de tu estado y del tipo de trabajo; CotizaBot te deja cobrar tax solo al material o también a la labor.'],
    ],
  },
  carpentry: {
    nombre: 'carpentry / carpintería',
    emoji: '🪚',
    h1: 'Estimates de carpentry en español',
    sub: 'Framing, trim, decks, puertas, closets, gabinetes — material y labor separados, por pieza, por pie o por trabajo. Estimate en dólares desde tu celular.',
    ejemplo: 'Deck de pressure treated 16x12 ft, barandal, 3 escalones, sellador',
    metaTitle: 'Estimates de Carpentry en Español — App para Carpinteros y Framers Hispanos en USA',
    metaDesc: 'Haz estimates de carpintería y framing en dólares desde tu celular, en español: decks, trim, puertas, closets, material y labor en un PDF profesional. El primero gratis.',
    bullets: ['Material y labor separados', 'Por pieza, por pie o por trabajo', 'Órdenes de cambio cuando el cliente pide más'],
    faq: [
      ['¿Cómo hago un estimate de carpintería en español?', 'Escribe el trabajo — "deck 16x12 con barandal y 3 escalones" — y CotizaBot arma el estimate en dólares con material y labor separados y PDF profesional.'],
      ['¿Sirve para framing con general contractors?', 'Sí: el PDF con folio y desglose es el formato que esperan, y puede salir en inglés.'],
      ['¿Cómo cobro los extras?', 'Con una orden de cambio sobre el estimate original; el cliente la aprueba desde su celular y queda registrado.'],
    ],
  },
  'pressure-washing': {
    nombre: 'pressure washing',
    emoji: '💦',
    h1: 'Estimates de pressure washing en español',
    sub: 'Casas, driveways, decks, techos y locales — por sqft o por trabajo, con servicios extra separados. Manda el estimate en dólares en 2 minutos.',
    ejemplo: 'Lavar casa 2 pisos 2,500 sqft, driveway, banqueta y patio de concreto',
    metaTitle: 'Estimates de Pressure Washing en Español — App para Hispanos en USA',
    metaDesc: 'Haz estimates de pressure washing en dólares desde tu celular, en español: casa, driveway, decks y locales por sqft o por trabajo. El primero gratis.',
    bullets: ['Por sqft o por trabajo', 'Driveway, decks y techos como renglones', 'Estimates recurrentes en segundos'],
    faq: [
      ['¿Cómo hago un estimate de pressure washing en español?', 'Describe el trabajo — "lavar casa 2 pisos, driveway y patio" — y CotizaBot arma el estimate en dólares con cada área separada y PDF profesional.'],
      ['¿Cómo cotizo trabajos recurrentes?', 'Guardas tus precios una vez y cada estimate nuevo sale en segundos desde tu celular.'],
      ['¿Sale en inglés?', 'Si quieres, sí: eliges el idioma del PDF.'],
    ],
  },
};

export default function OficioUSA({ slug }) {
  const o = OFICIOS_USA[slug];

  // Meta Pixel: Lead al picar cualquier botón que lleve a registro
  useEffect(() => {
    const h = (e) => {
      const a = e.target.closest && e.target.closest('a[href*="/registro"]');
      if (a && window.fbq) { try { window.fbq('track', 'Lead', { content_name: window.location.pathname }); } catch (err) {} }
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);
  if (!o) return <Navigate to="/usa" replace />;
  const url = `https://cotizaexpress.com/usa/${slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: o.h1,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      inLanguage: 'es',
      offers: { '@type': 'Offer', price: '29', priceCurrency: 'USD' },
      audience: { '@type': 'Audience', audienceType: `Contratistas hispanos de ${o.nombre} en Estados Unidos` },
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: o.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <Helmet>
        <title>{o.metaTitle} | CotizaBot</title>
        <meta name="description" content={o.metaDesc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={o.metaTitle} />
        <meta property="og:description" content={o.metaDesc} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/usa" className="flex items-center gap-2">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-emerald-200 flex-shrink-0">🤖</div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">CotizaBot</span>
          </Link>
          <Link to="/usa" className="text-sm text-slate-600 hover:text-blue-700">🇺🇸 Contratistas hispanos en USA</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-14 text-center">
        <p className="text-4xl mb-3">{o.emoji}</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">{o.h1}</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">{o.sub}</p>

        <div className="max-w-md mx-auto mb-8 text-left">
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-sm text-slate-800">"{o.ejemplo}"</div>
          <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm text-slate-800 mt-2">
            ✅ Estimate listo en USD: conceptos, labor, tax y PDF con folio. <span className="text-blue-700 font-semibold">Para mandarlo por texto o WhatsApp.</span>
          </div>
        </div>

        <Link to={`/registro?utm_source=usa_${slug}`}>
          <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-lg px-8 py-6">Hacer mi primer estimate GRATIS →</Button>
        </Link>
        <p className="text-sm text-slate-400 mt-3">$29 USD/mes después del primero · en español · se instala como app 📲</p>
        <p className="text-sm text-slate-500 mt-2">🔒 CotizaBot usa <strong>tus precios</strong> (los guardas una vez) · el PDF puede ir en español o en inglés</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 text-sm text-amber-900 max-w-xl mx-auto">
          👷 <strong>Labor y materiales separados</strong> en el mismo estimate — tu cliente ve el desglose claro y tú cierras el trabajo sin regateos.
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-left">
          {o.bullets.map((b, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700">✅ {b}</div>
          ))}
        </div>

        {/* FAQ visible (SEO + GEO) */}
        <section className="mt-14 text-left">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 text-center">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {o.faq.map(([q, a]) => (
              <details key={q} className="bg-white border border-slate-200 rounded-xl p-4">
                <summary className="font-semibold text-slate-800 cursor-pointer">{q}</summary>
                <p className="text-sm text-slate-600 mt-2">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Paso 2: el bot (misma escalera que México) */}
        <div className="mt-14 bg-slate-900 text-white rounded-2xl p-6 text-left">
          <h2 className="text-xl font-bold mb-2">🤖 ¿Tus clientes te escriben por WhatsApp?</h2>
          <p className="text-blue-100 text-sm mb-4">
            El paso 2 es CotizaBot: conecta tu número y contesta solo — lee lo que pide el cliente,
            usa tus precios de {o.nombre} y responde el estimate con PDF en segundos, 24/7, aunque estés en el trabajo. Desde $49 USD al mes.
          </p>
          <Link to={`/registro?utm_source=usa_${slug}_bot`}>
            <Button className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold">Quiero que conteste solo →</Button>
          </Link>
        </div>

        {/* Internal links a los demás oficios */}
        <div className="mt-12">
          <p className="text-sm text-slate-500 mb-3">También hacemos estimates de:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(OFICIOS_USA).filter(([s]) => s !== slug).map(([s, x]) => (
              <Link key={s} to={`/usa/${s}`} className="bg-slate-100 hover:bg-blue-100 text-slate-700 text-sm font-medium rounded-full px-4 py-2">
                {x.emoji} {x.nombre.charAt(0).toUpperCase() + x.nombre.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
