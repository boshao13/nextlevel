// server/services/turnstile.js
// Cloudflare Turnstile siteverify wrapper.
//
// Usage:
//   const ok = await verifyTurnstile(token, ip);
//   if (!ok) return res.status(403).json({ error: 'CAPTCHA failed' });
//
// If TURNSTILE_SECRET_KEY is not set in env, verifyTurnstile() ALWAYS returns true
// (skip-mode). This lets us deploy the integration before the operator has signed
// up for Turnstile; once the secret env var is set + pm2 restarted, enforcement
// kicks in.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Skip-mode. Log once per server boot — not per request — so the noise is bounded.
    if (!verifyTurnstile._warned) {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — CAPTCHA verification is disabled (open to bots)');
      verifyTurnstile._warned = true;
    }
    return true;
  }
  if (!token || typeof token !== 'string') return false;

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (ip) body.set('remoteip', ip);

    const resp = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp.ok) {
      console.error('[turnstile] siteverify HTTP', resp.status);
      return false;
    }
    const data = await resp.json();
    if (!data.success) {
      console.warn('[turnstile] siteverify rejected token:', data['error-codes']);
    }
    return !!data.success;
  } catch (err) {
    console.error('[turnstile] siteverify error:', err.message);
    // Fail open on network errors? No — fail closed to avoid an open hole during outages.
    return false;
  }
}

module.exports = { verifyTurnstile };
