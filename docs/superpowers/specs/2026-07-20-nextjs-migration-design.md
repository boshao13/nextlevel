# CRA → Next.js Migration — Design Spec

**Date:** 2026-07-20
**Status:** Approved by Bo (design sections approved in-session)
**Motivation:** Prerequisite for the automated weekly SEO blog (phase 2, separate spec). Also retires deprecated CRA and the fragile puppeteer prerender pipeline that currently carries all SEO correctness.

## 1. Goals

1. Replace CRA + react-helmet + `scripts/prerender.js` (puppeteer) with Next.js App Router (see version note in §4), server-rendered under PM2.
2. Preserve SEO byte-for-byte where it matters: identical URLs, titles, meta descriptions, canonicals, H1s, JSON-LD, robots/noindex behavior. No URL changes; no 301s needed.
3. Leave the Express API, MySQL, CRM/admin functionality, and nginx's security/canonical behavior untouched.
4. End state enables the phase-2 blog: new pages renderable at runtime (ISR) with no build/deploy.

**Non-goals:** No visual redesign (pages port 1:1, styled-components kept). No Express→Next API consolidation. No blog implementation (separate spec). No per-page OG images (site-wide card stays, respecting the prior de-indexing incident lesson).

## 2. Current-state constraints (verified 2026-07-20)

- CRA (react-scripts 5, React 18.3, react-router 6.26, styled-components 6.1, react-helmet 6.1). Routes defined only in `src/App.js`; one lazy chunk (AllColors).
- SEO today = `postbuild` puppeteer prerender with a hardcoded 16-route allow-list writing `build/<route>/index.html`; nginx `try_files $uri $uri/index.html =404` serves them; `error_page 404 /404/index.html` gives real 404s.
- `public/index.html` holds only site-wide tags (single 1200×630 OG card, base JSON-LD @graph with `#business` LocalBusiness + 3 Services, GA4 loader route-gated off `/admin*`//`/sign*`). Hard rule from a past de-indexing incident: per-page-overridable tags must have exactly one source of truth.
- `public/sitemap.xml` is fully hand-maintained (13 URLs, manual lastmod). No generator exists.
- Express API (`server/`) on 127.0.0.1:4242 under PM2 `nextlevel-api`; nginx proxies `/api/*` only. JWT + requireRole. MySQL on the same box.
- Deploy: laptop-only `deploy.sh` → `npm run build` (triggers prerender; needs local Chrome + gitignored media in `public/images|videos`, `src/images`) → rsync to EC2 → copy into nginx web root → `pm2 restart nextlevel-api`. No CI. Deploys the working tree, not a git ref.
- EC2: 1 vCPU, 954MB RAM (shared with MySQL + Express), Node 18.20.4 (≥ Next 15's minimum but EOL), 11GB free disk. **Too small to build on** — builds stay on the laptop.
- nginx config lives only on the box (`/etc/nginx/sites-enabled/default`); edits follow the incident-hardened procedure (backup outside sites-enabled → edit locally → scp → `nginx -t` → reload).
- `npm run test:server` borrows the jest binary hoisted from react-scripts' transitive deps; removing react-scripts silently breaks it unless jest becomes an explicit devDependency first.
- Working tree is dirty with uncommitted 2026-07-09 security fixes (`server/index.js`, `routes/auth|leads|timesheet`, `services/email.js`, `public/index.html`, 5 `src/` files).
- `/garage-makeover` is a redirect (React `<Navigate replace>` + nginx 301) to the canonical `/garagemakeover`; sitemap and prerender list use `/garagemakeover`.
- Public token routes `/sign/:token` and `/signed/:token` (customer e-sign flow) render outside PublicLayout (no Header/Footer) and are not prerendered — nginx special-cases them past `try_files … =404` today.

## 3. Decisions made with Bo (2026-07-20)

| Decision | Choice |
|---|---|
| Migration timing | Migrate first; blog is phase 2 on top of Next.js |
| Next.js architecture | App Router, `next start` Node server under PM2 (not Pages Router, not static export) |
| Styling | Keep styled-components v6 via Next's built-in compiler option (`compiler.styledComponents: true`) — 1:1 visual port |
| API | Express stays standalone on :4242; nginx keeps proxying `/api/*` to it unchanged |
| Admin | Stays a client-rendered SPA (`'use client'`) reusing AdminRoute/JWT; noindex preserved |
| Builds | Laptop-only, `output: 'standalone'`; EC2 never builds |
| Phase-2 blog (recorded for the next spec) | Fully automatic AI-written posts, weekly Monday; local + informational topic mix; images reused from the existing site photo library |

## 4. Architecture

```
nginx (unchanged: www-canonical, security headers, X-Robots map, cache rules)
 ├─ /api/*  → Express 127.0.0.1:4242   (PM2 "nextlevel-api", untouched)
 └─ /*      → Next.js 127.0.0.1:3000   (PM2 "nextlevel-web", `next start`)
```

- Next.js App Router, JavaScript (matching the repo; no TypeScript conversion). **Version note (2026-07-20, planning):** pinned at `next@^16.2.10` + React 19 — supersedes the "Next.js 15" wording elsewhere in this spec; requires Node ≥ 20.9 (laptop on Node 24; EC2 upgraded to Node 20 LTS during cutover step 2, before any Next process runs there).
- `next.config.js`: `compiler.styledComponents: true`, `output: 'standalone'`, `poweredByHeader: false`.
- Two PM2 apps on the box. Express is not modified, restarted only by deploys as today.
- MySQL, `.env` handling, Resend email: unchanged.

## 5. Route & component mapping

All current public URLs map 1:1 — the URL set does not change.

| URL | App Router location | Notes |
|---|---|---|
| `/` | `app/(public)/page.js` | Home (Hero, EpoxyInfo, Warranty, FlakeCarousel, Gallery, Testimonials, ContactForm) |
| `/commercial`, `/garagemakeover`, `/patios`, `/radon`, `/polished-concrete`, `/careers`, `/thank-you`, `/privacy`, `/terms`, `/snake` | `app/(public)/<route>/page.js` | 1:1 ports. Note: canonical is `/garagemakeover` (no hyphen); the `/garage-makeover` → `/garagemakeover` 301 stays in nginx AND is duplicated in `next.config.js` `redirects()` so the app is correct standalone |
| `/colors` | `app/(public)/colors/page.js` | Keeps code-split via `next/dynamic` (517-color catalog) |
| `/epoxy-flooring-albuquerque`, `-santa-fe`, `-rio-rancho` | `app/(public)/epoxy-flooring-<city>/page.js` — three literal folders | App Router can't do partial dynamic segments (`epoxy-flooring-[city]` would be literal), so: three thin `page.js` files importing one shared LocationPage server component fed by `src/locations.js` |
| `/sign/[token]`, `/signed/[token]` | `app/sign/[token]/page.js`, `app/signed/[token]/page.js` | Customer e-sign flow; `'use client'` ports of `src/public/SignDocument.jsx` / `Signed.jsx`; OUTSIDE the `(public)` group (no marketing chrome); noindex metadata; rendered natively by Next so today's nginx special-case for them is dropped at flip |
| `/admin/*` (incl. `/admin/login` + ~19 subroutes with params) | `app/admin/[[...rest]]/page.js` — single optional catch-all | `'use client'` page mounting the existing react-router admin tree (AdminRoute JWT gate, all subroutes) unchanged — minimal churn, one client bundle, exactly today's behavior; noindex via metadata `robots` + existing nginx X-Robots map |
| unknown URLs | `app/not-found.js` | Branded 404 (port of NotFound.jsx) with real HTTP 404 status natively |

Shared structure:

- `app/layout.js` (root, server component): only `<html>`/`<body>`, GlobalStyle, base metadata (site-wide OG image, og:site_name/locale/type, fallback title template, twitter:card/site defaults), base JSON-LD @graph (`#business` LocalBusiness + 3 Service nodes), and the GA4 `next/script` loader wrapped in a small client component reproducing today's route gating (no gtag on `/admin*`/`/sign*`).
- `app/(public)/layout.js` (route group): Header, Footer, StickyCallButton — marketing chrome wraps ONLY public pages, matching today's PublicLayout boundary; `/admin/*`, `/sign/[token]`, `/signed/[token]` stay chrome-free.
- Per-page `metadata` exports replace every react-helmet block: unique title, description, canonical (`https://www.nextlevelepoxynm.com<path>`), og:title/description/url, and the home page's `twitter:card/title/description/image` (distinct `twitter-image.jpg`). Next's metadata merging is the single source of truth — this natively eliminates the duplicate-tag class of bugs behind the past de-indexing incident.
- Per-page JSON-LD (location pages' Service + BreadcrumbList referencing `#business`) rendered as inline `<script type="application/ld+json">` in server components, same JS-object + `JSON.stringify` pattern as today's `LocationPage.jsx`.
- Page components are ported preserving their styled-components; interactive components get `'use client'`. Server/client split per page: a thin server `page.js` (metadata + JSON-LD) rendering the existing component tree.
- `src/lib/analytics.js` (GA4 form_submission / phone_click events) is kept as-is behind `'use client'` consumers.
- `app/sitemap.js` generates the sitemap from a single route manifest (static pages + `locations.js`) where each route carries a sitemap-inclusion flag — the generated set must reproduce exactly today's 13 URLs (`/snake` and `/thank-you` are deliberately excluded today; `/thank-you` is noindex and must stay out). `app/robots.js` generates robots.txt (Allow /, Disallow /admin/, sitemap pointer). The hand-maintained `public/sitemap.xml` is deleted. This manifest is the extension point phase 2's blog slugs plug into.
- `/thank-you` keeps its confirmed-current `noindex,follow` via its metadata export.
- The GA4 loader port must carry BOTH `gtag('config', …)` calls — GA4 (`G-NZ6KRRHCG0`) and the Google Ads tag (`AW-11478525428`) — Ads conversion tracking for the active campaigns depends on the second one.
- The admin catch-all mounts react-router client-only (`next/dynamic` `ssr: false` or a mount guard) since BrowserRouter touches `window`.
- The Snake easter egg and ThankYou page port unchanged.

## 6. SEO parity harness (cutover gate)

New permanent tooling: `scripts/seo-parity.js` (Node, no puppeteer — plain fetch + HTML parsing).

- **Route list source:** the union of (a) all URLs in the live sitemap, (b) the full 16-entry ROUTES list from `scripts/prerender.js` (captured before its deletion), and (c) fixed probes: one unknown URL (expect 404), `/admin` (expect noindex), `/garage-makeover` (expect 301 → `/garagemakeover`), `/sign/dummy-token` (expect 200 + noindex, no marketing chrome).
- **Snapshot mode:** crawls every route on `https://www.nextlevelepoxynm.com` and records per route: HTTP status, title, meta description, canonical, robots meta, og:title/description/url/image, twitter:* tags, H1 text, JSON-LD (parsed, key fields), redirect behavior (http→https, non-www→www).
- **Compare mode:** runs the same crawl against the staging target (`http://127.0.0.1:3000` on EC2, or local `next start`) and diffs against the snapshot. Exit non-zero on any difference not in an explicit allowlist file (e.g. sitemap lastmod values, intentional improvements). One known-intentional allowlist entry from day one: the literal `/404` URL serves 200 today (prerendered page) but HTTP 404 under Next — correct, and expected in the diff.
- Additional checks: unknown URL returns real HTTP 404; `/admin` carries noindex; sitemap URL set ⊇ snapshot URL set; robots.txt equivalent.
- **Gate:** nginx flip is forbidden until compare mode passes clean on the EC2 staging port.

## 7. Deploy & cutover

**Step 0 (prerequisite, before branch work):** commit the outstanding 2026-07-09 security fixes on `main` (they ship on any deploy regardless; make it deliberate). Migration then proceeds on a feature branch per repo norms.

**deploy.sh v2** (laptop): `npm run build` → rsync `.next/standalone/`, `.next/static/`, `public/` to EC2 (`--partial`, retry-once on failure) → `pm2 startOrRestart` `nextlevel-web` → health-check `curl 127.0.0.1:3000` → done. Express deploy path (rsync `server/` + `pm2 restart nextlevel-api`) unchanged. EC2's `npm install --omit=dev` step stays but serves only Express's deps — the standalone Next bundle ships its own node_modules and never depends on the box's install tree (removing react-scripts later just shrinks EC2's install).

**Staged cutover (one evening, low-traffic):**
1. Add 2GB swapfile on EC2 (insurance for the 954MB box); set PM2 `max_memory_restart` on both apps.
2. Upgrade EC2 Node 18 → 20 LTS (both PM2 apps restarted onto it; Express verified).
3. Deploy Next build; `nextlevel-web` runs on :3000 alongside the live static site — zero user impact.
4. Run the parity harness + Playwright smoke pass against :3000. Fix and redeploy until green.
5. nginx edit per incident procedure: `location /` → `proxy_pass http://127.0.0.1:3000` (keep `/api/*` proxy, all security headers, www-canonical, X-Robots map, and the `/garage-makeover` 301; drop the static-root try_files/error_page bits AND the `/sign*` SPA-fallback special-case — Next renders those natively now). The live config is captured off the box first so every existing block is consciously kept or dropped. `nginx -t` → reload.
6. Verify live site (spot URLs, real 404, GSC URL inspection on 2–3 pages).
7. **Rollback:** old static `build/` stays untouched in the web root; restoring the backed-up nginx config and reloading reverts the whole site in seconds. Keep for ≥2 weeks post-cutover.
8. Cleanup (separate commit, after stability): delete `scripts/prerender.js`, puppeteer, react-scripts, react-helmet, CRA config; remove old web-root copy step from deploy.sh.

## 8. Testing

- **Before react-scripts removal:** add `jest` as an explicit devDependency; verify `npm run test:server` passes (known gotcha: jest is currently hoisted from react-scripts). Re-home `src/admin/payPeriods.test.js` under the new setup; both test surfaces must run in the end state.
- **Parity harness** (section 6) — the primary migration-correctness instrument; kept permanently.
- **Playwright smoke pass** against staging :3000 before flip: quote form submits (Turnstile + anti-bot path to Express works cross-origin from the Next-rendered page), admin login, timesheet loads, phone-link analytics event fires, /colors catalog renders.
- **Build-time check:** every route in the manifest renders without error during `next build` (build fails loudly otherwise — replacing the old "did prerender capture it?" uncertainty).

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 954MB RAM shared by MySQL + Express + Next | `standalone` output, no EC2 builds, 2GB swap, PM2 memory-restart thresholds; measured during staging soak before flip |
| styled-components SSR hydration mismatches | Official compiler flag; mismatches surface in staging smoke/parity runs, not prod |
| Google reacting to the transition | URL set unchanged, meta byte-comparable via parity gate, sitemap improves (real lastmod); GSC spot-checks post-flip |
| nginx edit outage (prior incident) | Incident-hardened procedure + instant-rollback config backup; old static build retained |
| `test:server` silently breaks | jest pinned as explicit devDependency before react-scripts removal |
| rsync flakiness (historical) | `--partial` + one automatic retry in deploy.sh v2 |
| Node 18 EOL on EC2 | Upgrade to 20 LTS during cutover step 2, verified against Express before flip |
| Gitignored media required for build | Unchanged from today (laptop has them); document in deploy.sh header; not a new risk |

## 10. Out of scope / phase 2 (separate spec)

The automated SEO blog: MySQL-backed posts, `app/blog/[slug]` with ISR, Monday cron (in Express or OS crontab) calling the Claude API to generate on-brand posts (fully automatic — Bo's decision), local + informational topic mix, images selected from the existing site photo library, sitemap auto-inclusion via the route manifest, publish notification email via Resend. Blog content rules already on record: no street address ever, warranty scoped to indoor NL-prepared concrete, first-person Bo voice, intriguing/confident headings, unique non-templated text per post.
