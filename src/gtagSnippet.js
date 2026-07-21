/**
 * GA4 (G-NZ6KRRHCG0) + Google Ads (AW-11478525428) inline snippet, VERBATIM
 * from public/index.html's head IIFE. Rendered as an inline <script> in
 * app/layout.js — NOT a React effect — so it executes at parse time, before
 * hydration: pre-hydration bounces still register in GA4, identical to the
 * CRA site (keeps before/after Ads campaign comparisons clean). It runs once
 * per full page load and never on client-side nav, matching today.
 *
 * Skipped on /sign|/signed (the secret e-sign token in the URL would leak to
 * Google via page_location) and /admin (keep third-party JS off the origin
 * that holds the admin JWT). window.gtag stays defined everywhere so no code
 * throws. Both config calls are required — Ads conversion tracking for the
 * active campaigns depends on the AW- one.
 */
export const GTAG_SNIPPET = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
(function () {
  var p = window.location.pathname;
  if (p.indexOf('/sign') === 0 || p.indexOf('/admin') === 0) return;
  gtag('config', 'G-NZ6KRRHCG0');
  gtag('config', 'AW-11478525428');
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-NZ6KRRHCG0';
  document.head.appendChild(s);
})();
`;
