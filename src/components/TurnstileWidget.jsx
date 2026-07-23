// src/components/TurnstileWidget.jsx
// Thin React wrapper around Cloudflare Turnstile. No-op render when the
// site key isn't configured, so the integration can ship before the
// operator finishes Cloudflare signup. Once REACT_APP_TURNSTILE_SITE_KEY
// is baked into the build, every form mounts a real widget.
//
// Usage:
//   const [token, setToken] = useState('');
//   const turnstileRef = useRef(null);
//   <TurnstileWidget ref={turnstileRef} onToken={setToken} />
//   ...then include `turnstile_token: token` in the form POST body.
//   On ANY failed submit (4xx/5xx/network), call turnstileRef.current?.reset()
//   — tokens are single-use, so a retry must carry a fresh one or the server
//   403s it (the 2026-07-18 retry-loop bug).
//
// Loads the Turnstile script on first mount; safe to mount multiple times
// (turnstile.render is idempotent on the same container).
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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

const TurnstileWidget = forwardRef(({ onToken, theme = 'dark' }, ref) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  // NEXT_PUBLIC for the Next build; REACT_APP fallback keeps the CRA build working until cutover cleanup.
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.REACT_APP_TURNSTILE_SITE_KEY;

  // reset(): issue a fresh challenge/token. Callers MUST invoke this on every
  // failed submit — the old token is consumed server-side and would 403-loop.
  // onToken('') clears the parent's stale token until the new one arrives.
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current != null && window.turnstile) {
        try { window.turnstile.reset(widgetIdRef.current); } catch (e) { /* ignore */ }
        onToken && onToken('');
      }
    },
  }));

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
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
  return <div ref={containerRef} style={{ margin: '12px 0' }} />;
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
