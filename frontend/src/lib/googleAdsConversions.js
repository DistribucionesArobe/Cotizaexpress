const destinations = {
  lead: 'AW-18501694620/0q1YCOGRtaAdEJzppfZE',
  registration: 'AW-18501694620/ftmYCOSRtaAdEJzppfZE',
  purchase: 'AW-18501694620/nIX7CJ75qaYdEJzppfZE',
  botTrial: 'AW-18501694620/r91PCOqyqqgdEJzppfZE',
};

// Use the processor-confirmed payment, never a URL or a catalog price estimate.
export function trackGoogleAdsPurchase(payment) {
  if (typeof window.gtag !== 'function') return;
  try {
    if (!payment?.paid || payment.verified !== true || !payment.payment_id) return;
    const value = Number(payment.value);
    const currency = payment.currency;
    if (!Number.isFinite(value) || value <= 0 || !/^[A-Z]{3}$/.test(currency || '')) return;
    const transactionId = String(payment.payment_id);
    const plan = payment.plan || 'cotizador';
    window.gtag('event', 'purchase', {
      transaction_id: transactionId, value, currency,
      items: [{ item_id: plan || 'cotizador', item_name: plan || 'cotizador', price: value, quantity: 1 }],
    });
    window.gtag('event', 'conversion', {
      send_to: destinations.purchase,
      value,
      currency,
      transaction_id: transactionId,
    });
  } catch {
    // La medición nunca debe interrumpir la confirmación del pago.
  }
}

export function trackTrialStarted(trial) {
  if (!trial?.started || !trial.plan || !trial.ends_at || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'start_trial', { plan: trial.plan, trial_end: trial.ends_at });
    if (/^(cotizabot|pro)(_usa)?$/.test(trial.plan)) {
      window.gtag('event', 'conversion', { send_to: destinations.botTrial, value: 0, currency: 'MXN' });
    }
  } catch (_) {}
}

// Call only after the server confirms success. Never include customer data.
export function trackGoogleAdsConversion(action) {
  const sendTo = destinations[action];
  if (!sendTo || typeof window.gtag !== 'function') return;
  // Evento equivalente para GA4 (para poder marcarlo como evento clave)
  try { window.gtag('event', action === 'lead' ? 'generate_lead' : 'sign_up', { currency: 'MXN', value: 0 }); } catch (e) {}
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
