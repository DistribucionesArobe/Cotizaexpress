import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const MENSAJES = {
  'mensajes-para-clientes-whatsapp': {
    emoji: '💬',
    h1: 'Mensajes para clientes por WhatsApp: ejemplos para copiar',
    metaTitle: 'Mensajes para Clientes por WhatsApp: Ejemplos para Copiar y Pegar (2026)',
    metaDesc: 'Ejemplos de mensajes para enviar a clientes por WhatsApp: saludo, cotización, seguimiento, cobro, agradecimiento y recuperar clientes. Cópialos con un clic o mándalos directo.',
    intro: 'Mensajes listos para tu negocio: cópialos con un toque o mándalos directo por WhatsApp. Cambia lo que está entre [corchetes] por tus datos.',
    grupos: [
      ['👋 Saludo y bienvenida', [
        '¡Hola! Gracias por escribir a [Negocio] 😊 ¿En qué te puedo ayudar hoy?',
        'Hola, buen día. Soy [Nombre] de [Negocio]. Cuéntame qué necesitas y te ayudo con gusto.',
        '¡Bienvenido a [Negocio]! Si me mandas tu lista de material, te paso precio en unos minutos.',
      ]],
      ['🧾 Mandar una cotización', [
        'Hola [Cliente], te mando la cotización que me pediste: [link]. Incluye material y mano de obra. Cualquier duda, aquí estoy.',
        'Listo, aquí está tu cotización con folio [Folio]: [link]. El precio se respeta por [15] días.',
        'Te paso la cotización por escrito para que la revises con calma: [link]. Si quieres ajustar algo, dime y lo cambiamos.',
      ]],
      ['🔁 Seguimiento', [
        'Hola [Cliente], ¿pudiste revisar la cotización que te mandé? Si tienes dudas, te las resuelvo.',
        'Hola, te escribo para saber si la cotización te funcionó o si necesitas que ajustemos algo.',
        '[Cliente], te recuerdo que el precio de tu cotización se respeta hasta el [fecha]. ¿Lo agendamos?',
      ]],
      ['💳 Cobro y anticipo', [
        'Hola [Cliente], para agendar tu trabajo te pido un anticipo del [50]%: $[monto]. Te paso los datos para transferir: [datos].',
        'Gracias por confiar en nosotros. El saldo pendiente es de $[monto]. Puedes pagar por transferencia o con este link: [link].',
        'Hola, te recuerdo amablemente el pago de $[monto] del trabajo del [fecha]. Cualquier cosa, aquí estoy.',
      ]],
      ['🙏 Agradecimiento', [
        '¡Gracias por tu compra, [Cliente]! Fue un gusto atenderte. Aquí estamos para lo que necesites.',
        'Gracias por dejarnos hacer tu trabajo. Si quedaste contento, nos ayudaría mucho que nos recomiendes 🙌',
      ]],
    ],
    faq: [
      ['¿Qué mensaje mandar a un cliente por WhatsApp?', 'Uno corto, con su nombre y lo que necesita: un saludo, la información o el precio, y una pregunta que invite a responder. Arriba tienes ejemplos para cada momento: saludo, cotización, seguimiento, cobro y agradecimiento.'],
      ['¿Cómo mandar una cotización por WhatsApp?', 'Lo más profesional es mandar un PDF o link con folio, desglose e impuesto, en vez de precios sueltos en el chat. Con el Cotizador de CotizaExpress lo armas en 2 minutos desde el celular y lo mandas con un toque.'],
      ['¿Cada cuánto dar seguimiento a una cotización?', 'Un primer seguimiento a las 24-48 horas y otro antes de que venza la vigencia del precio. Más que eso suele molestar.'],
    ],
  },
  'mensajes-para-recuperar-clientes-whatsapp': {
    emoji: '🔄',
    h1: 'Mensajes para recuperar clientes por WhatsApp',
    metaTitle: 'Mensajes para Recuperar Clientes por WhatsApp: Ejemplos que Sí Contestan',
    metaDesc: 'Ejemplos de mensajes para recuperar clientes por WhatsApp: clientes que dejaron de comprar, cotizaciones sin respuesta y clientes inactivos. Copia y manda con un clic.',
    intro: 'Para el cliente que pidió precio y no volvió, o el que antes compraba y desapareció. La regla: corto, personal y con una razón para contestar.',
    grupos: [
      ['🧾 Pidió cotización y no contestó', [
        'Hola [Cliente], ¿sigues interesado en [trabajo/producto]? Si el precio fue el problema, dime y vemos opciones.',
        'Hola [Cliente], te escribo porque tu cotización vence el [fecha]. ¿Te la sostengo o la actualizamos?',
        '[Cliente], no quiero ser insistente: solo dime si lo dejamos para después o si te ayudo con algo más 🙂',
      ]],
      ['😴 Cliente que dejó de comprar', [
        'Hola [Cliente], hace tiempo que no sabemos de ti. ¿Todo bien? Si tienes alguna obra en puerta, aquí estamos.',
        '¡Hola [Cliente]! Nos acordamos de ti. Esta semana tenemos [producto/servicio] a buen precio. ¿Te paso cotización?',
        'Hola [Cliente], ¿hubo algo que no te gustó la última vez? Me ayudaría mucho saberlo para mejorar.',
      ]],
      ['🎁 Con una razón para regresar', [
        'Hola [Cliente], para clientes como tú tenemos [descuento/beneficio] este mes. ¿Te interesa que te cotice?',
        '[Cliente], nos llegó [producto nuevo/material] que te puede servir para [uso]. ¿Te mando precio?',
        'Hola [Cliente], tenemos agenda libre la próxima semana. Si tenías algo pendiente, es buen momento.',
      ]],
    ],
    faq: [
      ['¿Cómo recuperar a un cliente que no contestó la cotización?', 'Escríbele una sola vez a las 48 horas con una pregunta concreta (¿seguimos?, ¿ajustamos algo?) y otra antes de que venza el precio. Mandar la cotización formal en PDF desde el principio también sube mucho la tasa de respuesta.'],
      ['¿Qué no hacer al recuperar clientes por WhatsApp?', 'No mandes mensajes genéricos masivos, no insistas todos los días y no culpes al cliente. Personaliza con su nombre y lo que pidió.'],
      ['¿Cuántos mensajes de seguimiento son demasiados?', 'Más de dos o tres sin respuesta ya cansa. Deja la puerta abierta con un mensaje amable y sigue con otros clientes.'],
    ],
  },
  'mensajes-de-seguimiento-a-clientes-whatsapp': {
    emoji: '🔁',
    h1: 'Mensajes de seguimiento a clientes por WhatsApp',
    metaTitle: 'Mensajes de Seguimiento a Clientes por WhatsApp: Ejemplos para Copiar',
    metaDesc: 'Ejemplos de mensajes de seguimiento por WhatsApp: después de cotizar, después de vender, para agendar y para cobrar. Cópialos o mándalos directo con un clic.',
    intro: 'El seguimiento es donde se gana la venta: la mayoría de los clientes no dice que no, simplemente se olvida. Estos mensajes los regresan sin sonar insistente.',
    grupos: [
      ['🧾 Después de mandar la cotización', [
        'Hola [Cliente], ¿te llegó bien la cotización? Si tienes dudas sobre algún concepto, te explico.',
        'Hola [Cliente], ¿pudiste revisarla? Si quieres podemos ajustar cantidades o material.',
        '[Cliente], el precio se respeta hasta el [fecha]. ¿Quieres que te aparte la fecha para el trabajo?',
      ]],
      ['📅 Para agendar', [
        'Hola [Cliente], tengo disponibilidad el [día] y el [día]. ¿Cuál te acomoda mejor?',
        'Perfecto, quedamos el [día] a las [hora]. Un día antes te confirmo por aquí.',
      ]],
      ['✅ Después del trabajo o la venta', [
        'Hola [Cliente], ¿cómo quedó todo? Si ves algún detalle, avísame y lo resolvemos.',
        'Gracias de nuevo, [Cliente]. Si conoces a alguien que necesite [servicio], con gusto lo atendemos.',
      ]],
      ['💳 Para cobrar sin incomodar', [
        'Hola [Cliente], te comparto el saldo pendiente: $[monto]. Te paso los datos para transferir: [datos].',
        'Hola [Cliente], solo para recordarte el pago de $[monto] con vencimiento el [fecha]. ¡Gracias!',
      ]],
    ],
    faq: [
      ['¿Cuándo dar seguimiento a un cliente por WhatsApp?', 'A las 24-48 horas de mandar la cotización, antes de que venza el precio, y unos días después de terminar el trabajo para asegurar que quedó contento.'],
      ['¿Cómo hacer seguimiento sin ser insistente?', 'Haz una pregunta concreta, ofrece algo útil (ajustar la cotización, fechas disponibles) y no mandes más de dos o tres mensajes sin respuesta.'],
      ['¿Ayuda mandar la cotización en PDF?', 'Sí: una cotización formal con folio, desglose y vigencia da confianza y le da al cliente algo concreto que revisar y aprobar.'],
    ],
  },
  'saludos-para-clientes-whatsapp': {
    emoji: '👋',
    h1: 'Saludos para clientes por WhatsApp: ejemplos para negocio',
    metaTitle: 'Saludos para Clientes por WhatsApp: Ejemplos Profesionales para tu Negocio',
    metaDesc: 'Ejemplos de saludos para clientes por WhatsApp Business: bienvenida, primer contacto, fuera de horario y clientes frecuentes. Copia y pega o mándalos con un clic.',
    intro: 'El primer mensaje marca el tono. Estos saludos suenan profesionales sin perder lo cercano. Úsalos como mensaje de bienvenida o respuesta rápida.',
    grupos: [
      ['👋 Bienvenida', [
        '¡Hola! Gracias por escribir a [Negocio] 😊 ¿En qué te podemos ayudar?',
        'Hola, bienvenido a [Negocio]. Mándanos tu lista o dinos qué necesitas y te cotizamos al momento.',
        '¡Hola! Soy [Nombre] de [Negocio]. Con gusto te atiendo. ¿Qué andas buscando?',
      ]],
      ['🌙 Fuera de horario', [
        'Hola, gracias por escribir. Nuestro horario es de [hora] a [hora]. Te respondemos a primera hora 🙌',
        '¡Gracias por tu mensaje! Ahorita estamos cerrados, pero mañana a las [hora] te contestamos. Si quieres, déjanos tu lista.',
      ]],
      ['⭐ Clientes frecuentes', [
        '¡Hola [Cliente]! Qué gusto saludarte de nuevo. ¿Qué necesitas esta vez?',
        'Hola [Cliente], ¿cómo va la obra? Aquí estamos para lo que se ofrezca.',
      ]],
      ['📣 Primer contacto', [
        'Hola [Cliente], soy [Nombre] de [Negocio]. Te escribo porque nos pediste información sobre [producto/servicio]. ¿Te paso precios?',
        'Hola, ¿cómo estás? Vi que te interesa [servicio]. Si me cuentas un poco del trabajo, te mando una cotización hoy mismo.',
      ]],
    ],
    faq: [
      ['¿Cómo saludar a un cliente por WhatsApp de forma profesional?', 'Con su nombre si lo sabes, el nombre de tu negocio y una pregunta abierta para que te diga qué necesita. Corto y amable.'],
      ['¿Cómo poner un saludo automático en WhatsApp Business?', 'En WhatsApp Business ve a Herramientas para la empresa → Mensaje de bienvenida y pega uno de estos saludos. Para que también conteste precios solo, necesitas un bot como CotizaBot.'],
      ['¿Qué poner en el mensaje de fuera de horario?', 'Tu horario, cuándo vas a contestar y una invitación a dejar su lista o pedido para atenderlo primero.'],
    ],
  },
};

function Mensaje({ texto }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-slate-800 text-[15px] leading-relaxed mb-3">{texto}</p>
      <div className="flex gap-2">
        <button
          onClick={() => { navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500); }}
          className={`text-sm font-semibold rounded-lg px-3 py-1.5 border ${ok ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
        >{ok ? '✓ Copiado' : '📋 Copiar'}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer"
           className="text-sm font-semibold rounded-lg px-3 py-1.5 bg-[#25D366] text-white hover:bg-[#1ebe57]">📲 Mandar por WhatsApp</a>
      </div>
    </div>
  );
}

export default function MensajesWhatsApp({ slug }) {
  const o = MENSAJES[slug];
  if (!o) return <Navigate to="/" replace />;
  const url = `https://cotizaexpress.com/${slug}`;
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: o.h1, inLanguage: 'es', url,
      author: { '@type': 'Organization', name: 'CotizaExpress' }, publisher: { '@type': 'Organization', name: 'CotizaExpress' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: o.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
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
          <Link to="/generador-de-cotizaciones"><Button className="bg-emerald-600 hover:bg-emerald-700">Hacer una cotización</Button></Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-4xl text-center mb-3">{o.emoji}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 text-center leading-tight">{o.h1}</h1>
        <p className="text-slate-600 text-center mb-8">{o.intro}</p>

        {o.grupos.map(([titulo, msgs], gi) => (
          <section key={titulo} className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{titulo}</h2>
            <div className="space-y-3">{msgs.map((m) => <Mensaje key={m} texto={m} />)}</div>
            {gi === 1 && (
              <div className="mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white text-center">
                <p className="font-bold mb-1">¿Te pidieron precio? Mándale una cotización formal, no un precio suelto</p>
                <p className="text-emerald-50 text-sm mb-3">Con folio, IVA y PDF en 2 minutos desde tu celular. Gratis, sin registro.</p>
                <Link to={`/generador-de-cotizaciones?utm_source=${slug}`}>
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold">Hacer mi cotización gratis →</Button>
                </Link>
              </div>
            )}
          </section>
        ))}

        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mb-10">
          <p className="font-bold text-slate-900 mb-1">🤖 ¿Contestas los mismos mensajes todo el día?</p>
          <p className="text-sm text-slate-600 mb-3">CotizaBot contesta solo en tu WhatsApp: lee lo que pide el cliente, busca tus precios y responde la cotización con PDF en segundos, 24/7.</p>
          <Link to="/" className="text-emerald-700 font-semibold text-sm underline">Ver cómo funciona →</Link>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-4">Preguntas frecuentes</h2>
        <div className="space-y-3 mb-10">
          {o.faq.map(([q, a]) => (
            <details key={q} className="bg-white border border-slate-200 rounded-xl p-4">
              <summary className="font-semibold text-slate-800 cursor-pointer">{q}</summary>
              <p className="text-sm text-slate-600 mt-2">{a}</p>
            </details>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">Más mensajes:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(MENSAJES).filter(([s]) => s !== slug).map(([s, x]) => (
              <Link key={s} to={`/${s}`} className="bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 text-sm font-medium rounded-full px-4 py-2">{x.emoji} {x.h1.split(':')[0]}</Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
