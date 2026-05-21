# Branded 404 Page — Design

**Date:** 2026-05-20
**Status:** Approved (design); pending implementation plan
**Project:** Next Level Epoxy Flooring website (CRA + styled-components, prerendered, nginx on EC2)

## Problem

The catch-all route renders an unstyled `<h1>404 - Page Not Found</h1>`
(`src/App.js`, `<Route path="*">`). It is off-brand, offers no way back, and
unknown URLs return HTTP 200 (a "soft 404") because the SPA serves
`index.html` for every path.

## Goals

1. A branded, on-brand-witty 404 page that fits the existing site design.
2. Convert lost visitors back toward conversion (quote) or the homepage.
3. Return a real HTTP 404 status for genuinely missing URLs.

## Non-Goals (YAGNI)

- No site search.
- No popular-page link list, no inline phone number (the site-wide sticky
  call button already covers phone). Two buttons only.
- No new image assets.

## Decisions (from brainstorming)

- **Tone:** playful / on-brand witty.
- **Visual treatment:** Approach A — bold "404" numeral with a small gold
  flake accent (chosen over logo-led and full epoxy-texture treatments).
- **Actions:** primary "Get a Free Quote" + secondary "Back to Home".
- **HTTP status:** include the real-404 infrastructure (Section 2).

## Section 1 — Component, Layout & Copy

### Component

- New file `src/NotFound.jsx`, default-exported styled-components component.
- `src/App.js`: replace the inline `path="*"` element with `<NotFound />`.
  Also add an explicit `<Route path="/404" element={<NotFound />} />` (needed
  for prerendering — see Section 2).
- Renders inside the existing `PublicLayout` (`Header`, `Footer`,
  `StickyCallButton` already wrap it). `NotFound` is only the centered inner
  content section.
- Styling uses the existing GlobalStyle CSS custom properties: `--primary`
  (#0f4c81), `--accent` (#f0a500), `--text`, `--text-mid`, radius/shadow/
  transition tokens. No new design tokens.

### Layout (centered column, generous vertical padding)

1. Decorative **"404"** — oversized, font-weight 800, color `--primary`.
   Rendered as a styled `div` (NOT a heading element) so it does not compete
   with the page `<h1>` for SEO.
2. **Gold flake accent** — 4–5 small `--accent` dots of varying size
   scattered near the "404"; pure CSS, decorative, `aria-hidden`.
3. **Headline** — the single `<h1>` on the page:
   "This page slipped through a crack in the concrete."
4. **Subtext** — one line:
   "The page you're after moved, got resurfaced, or never existed — let's get
   you back on solid ground."
5. **Two buttons** (side by side; stack vertically on mobile ≤600px):
   - Primary, gold fill: "Get a Free Quote" → navigates to the homepage
     contact form, reusing the Header's existing scroll-to-contact pattern
     (`navigate('/', { state: { scrollToContact: true } })`).
   - Secondary, navy outline: "Back to Home" → React Router `Link` to `/`.

### Meta

`<Helmet>` block (same pattern as `src/ThankYou.jsx`):
- `<title>Page Not Found | Next Level Epoxy</title>`
- `<meta name="robots" content="noindex,follow">`

Exactly one `<h1>` on the page (the headline).

## Section 2 — Real HTTP 404 Status

### Changes

1. **`src/App.js`** — add `<Route path="/404" element={<NotFound />} />`
   (explicit, in addition to `path="*"`). The `path="*"` catch-all still
   renders `<NotFound />` for bad client-side (in-SPA) navigation.
2. **`scripts/prerender.js`** — add two routes to the prerender allow-list:
   - `/404` — so the build produces `build/404/index.html`, a real static
     file nginx can serve as the error page.
   - `/snake` — currently a valid route with NO prerendered file. The nginx
     change below would otherwise wrongly return 404 for it. `/snake` is the
     easter-egg page; prerendering it is harmless.
   - **Also update the stale comment** at the top of the `ROUTES` allow-list
     (`scripts/prerender.js`, currently reads `/snake is an easter egg,
     skip.`). Adding `/snake` to the list contradicts that comment — the
     implementation must rewrite/remove it or a future reader hits a
     contradiction.
3. **nginx** (main `www.nextlevelepoxynm.com` server block, `location /`):
   - Change `try_files $uri $uri/index.html /index.html;`
     → `try_files $uri $uri/index.html =404;`
   - Add `error_page 404 /404/index.html;`
   - The `location ^~ /admin` block is untouched — it keeps its own
     `try_files ... /index.html` SPA fallback and stays HTTP 200.
   - **nginx footgun:** `error_page 404 /404/index.html;` (no `=200` suffix)
     correctly preserves the 404 status. Do NOT append `=200`, and do not
     wrap the target in a location that rewrites the status. The Testing
     step-4 `curl -I` check is the definitive confirmation — verify it, do
     not "fix" a correct 404 into a 200.

### Resulting behavior

- Every real public route is prerendered → file exists → served HTTP 200.
- A genuinely missing URL → `try_files` `=404` → `error_page` serves
  `build/404/index.html` (the branded page) with HTTP **404**.
- Bad client-side navigation within the loaded SPA → React `path="*"`
  renders `<NotFound />` (no full reload, no status code involved).
- `/admin/*` → unchanged, SPA shell, 200.

### Risk / invariant

The nginx `=404` is only safe if **every valid public client route has a
prerendered `build/<route>/index.html`**. The prerender allow-list must
therefore stay in sync with `App.js` public routes. After this change the
allow-list covers: `/`, `/commercial`, `/garagemakeover`, `/patios`,
`/colors`, `/polished-concrete`, `/careers`, `/radon`, `/thank-you`,
`/epoxy-flooring-{albuquerque,santa-fe,rio-rancho}`, `/404`, `/snake`.
Adding a future public route REQUIRES adding it to the prerender list, or it
will incorrectly return 404. This invariant must be documented in a comment
next to the prerender allow-list as part of the implementation.

**Redirect-only routes — already handled, no action needed.** `App.js` has
`path="/garage-makeover"` → `<Navigate to="/garagemakeover">`, a client-side
redirect with no prerendered file. It is NOT broken by the `=404` change
because nginx already has an exact-match block
`location = /garage-makeover { return 301 .../garagemakeover; }` (added
earlier in the 2026-05-20 GSC follow-up work). Exact-match locations are
evaluated before the prefix `location /`, so a direct hit on
`/garage-makeover` is 301-redirected and never reaches the `=404` `try_files`.
If any future redirect-only route is added, it likewise needs either an
nginx redirect or prerendering — do not rely on the SPA `<Navigate>` alone
once `=404` is in effect.

## Files Changed

| File | Change |
|---|---|
| `src/NotFound.jsx` | New — the branded 404 component |
| `src/App.js` | `path="*"` → `<NotFound />`; add `path="/404"` route |
| `scripts/prerender.js` | Add `/404` and `/snake` to the allow-list |
| nginx `sites-enabled/default` | `location /`: `=404` + `error_page 404 /404/index.html` |

## Deployment

Standard `./deploy.sh` (build + prerender + rsync) for the React/prerender
changes. The nginx change is applied separately on EC2: back up the config,
`sudo nginx -t`, reload only if the test passes (same test-gated pattern
used in prior nginx work).

## Testing / Verification

1. **Build** — confirm `build/404/index.html` and `build/snake/index.html`
   are produced by the prerender step.
2. **Visual** — load a bad URL; confirm the branded page renders with
   Header/Footer/sticky-call, one `<h1>`, both buttons.
3. **Buttons** — "Get a Free Quote" lands on the homepage contact form;
   "Back to Home" lands on `/`.
4. **HTTP status** — `curl -sI https://www.nextlevelepoxynm.com/no-such-page`
   returns `HTTP/.. 404`; a real route (e.g. `/commercial`) still returns
   `200`; `/snake` returns `200`.
5. **SEO** — the 404 page emits `noindex,follow` and exactly one `<h1>`.
6. **Regression** — `/admin/login` still loads (200); `/garage-makeover`
   still 301s; every URL in `public/sitemap.xml` still returns 200 with one
   self-canonical (diff the sitemap against the prerender allow-list to
   confirm none was missed).
