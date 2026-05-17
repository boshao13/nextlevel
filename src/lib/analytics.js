/**
 * Lightweight gtag wrapper. The base GA4 tag (G-NZ6KRRHCG0) is loaded in
 * public/index.html. These helpers fire custom events that we'll mark as
 * conversions in GA4 and import into Google Ads.
 *
 * Safe to call even if gtag isn't available (e.g., ad-blockers, dev) — fails
 * silently rather than throwing.
 */

function send(name, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  try {
    // transport_type 'beacon' uses navigator.sendBeacon, which survives
    // immediate page transitions like iOS tel: link taps that hand off to
    // the dialer before a normal XHR can complete.
    window.gtag('event', name, { ...params, transport_type: 'beacon' });
  } catch {
    /* swallow */
  }
}

/**
 * Fire when a lead form successfully submits.
 * @param {'residential' | 'commercial' | 'career'} formType
 */
export function trackFormSubmission(formType) {
  send('form_submission', {
    form_type: formType,
    // GA4 conversion-eligible event; value lets us roughly estimate lead worth
    value: formType === 'commercial' ? 75 : 50,
    currency: 'USD',
  });
}

/**
 * Fire when a user taps/clicks a tel: link.
 * @param {string} location  Where on the site the link lives (e.g. 'header', 'footer').
 */
export function trackPhoneClick(location) {
  send('phone_click', {
    click_location: location,
    value: 50,
    currency: 'USD',
  });
}
