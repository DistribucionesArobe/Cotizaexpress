const destinations = {
  lead: 'AW-18501694620/0q1YCOGRtaAdEJzppfZE',
  registration: 'AW-18501694620/ftmYCOSRtaAdEJzppfZE',
};

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
