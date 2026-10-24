const KEY = 'cx_acquisition';
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const internalSource = source => /^(generador|precios)(_|$)/.test(source || '');

// Keep campaign attribution through internal links without storing customer data.
export function getAcquisition(search = window.location.search) {
  const params = new URLSearchParams(search);
  const current = Object.fromEntries(FIELDS.filter(key => params.has(key)).map(key => [key, params.get(key)]));
  let stored = {};
  try { stored = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (_) {}
  if (current.utm_source && !internalSource(current.utm_source)) return current;
  return stored.utm_source ? stored : current;
}

export function rememberAcquisition(search) {
  const acquisition = getAcquisition(search);
  try { if (acquisition.utm_source) sessionStorage.setItem(KEY, JSON.stringify(acquisition)); } catch (_) {}
}

export function trialRegistrationUrl(plan, search = window.location.search) {
  const params = new URLSearchParams(getAcquisition(search));
  params.set('plan', plan);
  if (plan === 'cotizabot' || plan === 'pro') params.set('intent', 'bot');
  return `/registro?${params.toString()}`;
}

export function acquisitionRegion(acquisition, fallback) {
  if ((acquisition.utm_source || '').startsWith('usa')) return 'US';
  if (/^(MX_|busqueda_generador$|bot_prueba$)/.test(acquisition.utm_campaign || '')) return 'MX';
  return fallback || 'MX';
}

export function registrationTrialPlan(search = window.location.search) {
  const params = new URLSearchParams(search);
  const explicit = (params.get('plan') || '').toLowerCase();
  if (['cotizador', 'cotizabot', 'pro'].includes(explicit)) return explicit;
  const acquisition = getAcquisition(search);
  return params.get('intent') === 'bot' || /bot/.test((acquisition.utm_source || '') + (acquisition.utm_campaign || ''))
    ? 'cotizabot' : 'cotizador';
}
