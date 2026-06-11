// src/components/TurnstileWidget.jsx
// Thin React wrapper around Cloudflare Turnstile. No-op render when the
// site key isn't configured, so the integration can ship before the
// operator finishes Cloudflare signup. Once REACT_APP_TURNSTILE_SITE_KEY
// is baked into the build, every form mounts a real widget.
//
// Usage:
//   const [token, setToken] = useState('');
//   <TurnstileWidget onToken={setToken} />
//   ...then include `turnstile_token: token` in the form POST body.
//
// Loads the Turnstile script on first mount; safe to mount multiple times
// (turnstile.render is idempotent on the same container).
import React, { useEffect, useRef } from 'react';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  let p = window.__turnstileLoad;
  if (!p) {
    p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TURNSTILE_SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Turnstile'));
      document.head.appendChild(s);
    });
    window.__turnstileLoad = p;
  }
  return p;
}

const TurnstileWidget = ({ onToken, theme = 'dark' }) => {
  const ref = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !ref.current) return;
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (token) => onToken && onToken(token),
          'error-callback': () => onToken && onToken(''),
          'expired-callback': () => onToken && onToken(''),
          theme,
        });
      })
      .catch((err) => console.error('TurnstileWidget:', err));

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch (e) { /* ignore */ }
      }
    };
  }, [siteKey, onToken, theme]);

  // Without a site key, render nothing — forms work as they always did.
  if (!siteKey) return null;
  return <div ref={ref} style={{ margin: '12px 0' }} />;
};

export default TurnstileWidget;
