'use client';

import { useEffect } from 'react';

/**
 * GA4 (G-NZ6KRRHCG0) + Google Ads (AW-11478525428) loader, ported verbatim
 * from public/index.html's inline IIFE. Loaded ONLY on public marketing
 * routes: skipped on /sign|/signed (the secret e-sign token in the URL would
 * leak to Google via page_location) and /admin (keep third-party JS off the
 * origin that holds the admin JWT). window.gtag stays defined everywhere so
 * no code throws. Both config calls are required — Ads conversion tracking
 * for the active campaigns depends on the AW- one.
 */
export default function GtagLoader() {
  useEffect(() => {
    // Guard against dev StrictMode double-invoke / any re-mount.
    if (window.__gtagLoaderRan) return;
    window.__gtagLoaderRan = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());

    var p = window.location.pathname;
    if (p.indexOf('/sign') === 0 || p.indexOf('/admin') === 0) return;
    gtag('config', 'G-NZ6KRRHCG0');
    gtag('config', 'AW-11478525428');
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-NZ6KRRHCG0';
    document.head.appendChild(s);
  }, []);

  return null;
}
