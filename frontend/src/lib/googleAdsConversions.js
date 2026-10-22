const destinations = {
  lead: 'AW-18501694620/0q1YCOGRtaAdEJzppfZE',
  registration: 'AW-18501694620/ftmYCOSRtaAdEJzppfZE',
  purchase: 'AW-18501694620/nIX7CJ75qaYdEJzppfZE',
};

const PLAN_MXN = {
  cotizador: 299, cotizabot: 1000, pro: 2000, enterprise: 4000,
  cotizador_usa: 519, cotizabot_usa: 879, pro_usa: 1789,
};

// Pago confirmado: valor real del plan (MXN) y el id del pago para no contar doble.
export function trackGoogleAdsPurchase(externalReference, transactionId) {
  if (typeof window.gtag !== 'function') return;
  try {
    const parts = String(externalReference || '').split('|');
    const plan = parts[1] || '';
    const intro = parts[2] === 'intro';
    const value = intro ? (plan === 'cotizador_usa' ? 169 : 99) : (PLAN_MXN[plan] || 299);
    window.gtag('event', 'conversion', {
      send_to: destinations.purchase,
      value,
      currency: 'MXN',
      transaction_id: String(transactionId || ''),
    });
  } catch {
    // La medición nunca debe interrumpir la confirmación del pago.
  }
}

// Call only after the server confirms success. Never include customer data.
export function trackGoogleAdsConversion(action) {
  const sendTo = destinations[action];
  if (!sendTo || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value: 0,
      currency: 'MXN',
    });
  } catch {
    // Measurement must not interrupt PDF delivery or registration.
  }
}
