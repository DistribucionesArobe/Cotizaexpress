const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(name, exports, globals) {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib', name), 'utf8');
  const context = vm.createContext({ ...globals, module: { exports: {} } });
  vm.runInContext(source.replace(/export /g, '') + `\nmodule.exports = {${exports}}`, context);
  return context.module.exports;
}

const storage = new Map();
const acquisition = load('acquisition.js', 'getAcquisition,rememberAcquisition,trialRegistrationUrl,acquisitionRegion', {
  URLSearchParams,
  window: { location: { search: '?utm_source=google&utm_medium=cpc&utm_campaign=bot_prueba' } },
  sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
});
acquisition.rememberAcquisition('?utm_source=google&utm_campaign=bot_prueba');
let url = new URL(acquisition.trialRegistrationUrl('cotizabot'), 'https://cotizaexpress.com');
assert.equal(url.pathname, '/registro');
assert.equal(url.searchParams.get('utm_source'), 'google');
assert.equal(url.searchParams.get('utm_campaign'), 'bot_prueba');
assert.equal(url.searchParams.get('plan'), 'cotizabot');
assert.equal(url.searchParams.get('intent'), 'bot');
assert.equal(acquisition.getAcquisition('?utm_source=generador_post_pdf').utm_source, 'google');
assert.equal(acquisition.acquisitionRegion({ utm_campaign: 'bot_prueba' }, 'US'), 'MX');
assert.equal(acquisition.acquisitionRegion({ utm_source: 'usa_google' }, 'MX'), 'US');
acquisition.rememberAcquisition('?utm_source=bing&utm_campaign=otra');
assert.equal(acquisition.getAcquisition('').utm_source, 'bing');

const events = [];
const tracking = load('googleAdsConversions.js', 'trackGoogleAdsPurchase,trackTrialStarted,trackGoogleAdsConversion', {
  window: { gtag: (...event) => events.push(event) },
});
for (const payment of [null, { paid: false }, { paid: true, value: 99 },
  { paid: true, verified: true, payment_id: '1', value: null, currency: 'MXN' },
  { paid: true, verified: true, payment_id: '1', value: 99, currency: 'invalid' }]) {
  tracking.trackGoogleAdsPurchase(payment);
}
assert.equal(events.length, 0, 'Unverified or incomplete payments must not count');
tracking.trackGoogleAdsPurchase({ paid: true, verified: true, payment_id: 'mp-123', value: 129.5, currency: 'MXN', plan: 'cotizador' });
assert.equal(events.length, 2);
for (const event of events) {
  assert.equal(event[2].value, 129.5, 'Use confirmed amount, not plan list price');
  assert.equal(event[2].transaction_id, 'mp-123');
}
events.length = 0;
tracking.trackTrialStarted(null);
tracking.trackTrialStarted({ started: false, plan: 'cotizabot', ends_at: '2026-11-01' });
assert.equal(events.length, 0);
tracking.trackTrialStarted({ started: true, plan: 'cotizabot', ends_at: '2026-11-01' });
assert.equal(events[0][1], 'start_trial');
assert.equal(events[0][2].plan, 'cotizabot');
assert.equal(events[1][1], 'conversion');
assert.match(events[1][2].send_to, /r91PCOqyqqgdEJzppfZE$/);
events.length = 0;
tracking.trackTrialStarted({ started: true, plan: 'cotizador', ends_at: '2026-11-01' });
assert.equal(events.length, 1, 'Cotizador trial must not count as a bot trial');
console.log('Acquisition, market selection, verified revenue and trial tracking: passed');
