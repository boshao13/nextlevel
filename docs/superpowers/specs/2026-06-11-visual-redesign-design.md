# Visual Redesign — Dark Showroom Skin (2026-06-11)

Approved design for the full visual rework of nextlevelepoxynm.com. Redesign, not rebuild:
same pages, routes, copy, conversion flow. New skin only.

## Direction

Premium garage-culture / automotive-showroom aesthetic. Deep charcoal base, graphite
elevated surfaces, resin-amber glossy accent, metallic navy secondary. Big confident type
(Poppins retained — user-approved), generous whitespace, epoxy-themed inline SVG identity,
fire-once scroll-triggered animation moments on the homepage.

## Invariants (must not break)

1. **styled-components stays** — `scripts/prerender.js` extracts CSSOM from `data-styled`
   stylesheets into `data-prerender-css`. No CSS-modules/Tailwind migration.
2. **Per-page `<Helmet>` blocks stay** — titles/canonicals/JSON-LD are captured at
   prerender time. Routes stay in sync with the prerender ROUTES array.
3. **Conversion flow byte-identical**: form field names (`user_name`, `user_number`,
   `user_email`, `area_desired`), Turnstile mount, POST `/api/leads`, `source` params,
   `trackFormSubmission`/`trackPhoneClick` wiring, hard redirect to `/thank-you`.
4. **Copy, pricing claims, warranty + anti-slip disclaimers (Warranty.jsx), phone number,
   page routes unchanged.**
5. Hero video element unchanged functionally (autoplay/loop/muted/playsInline,
   webm+mp4, `preload="metadata"`) — gains a poster.
6. Anchor IDs preserved: `contact`, `gallery`, `commercial-contact`, `makeover-details`,
   `patio-contact`. The `.reveal`/`.visible` class contract preserved.
7. Exactly one H1 per page. The `sr-only` H1 + `noscript` block in `public/index.html`
   is removed (prerender bakes real per-page H1s into served HTML).
8. Footer Admin + `/snake` links removed; routes stay functional.

## Token system (GlobalStyle.jsx)

- Base: `--bg #0d0f12`, surfaces `#15181d` / `#1c2026`, gunmetal borders.
- Accent: resin amber `#f0a500` family (gradient "wet epoxy" treatments).
- Secondary: brand navy `#0f4c81` as metallic blue (continuity with logo/favicon).
- Text tuned for WCAG AA on dark. Type scale via `clamp()` tokens. Spacing scale.
- Motion tokens + global `prefers-reduced-motion: reduce` (CSS + useScrollReveal).

## SVG accent library (`src/accents/`)

Hand-written inline SVG components, `aria-hidden` when decorative, transform/opacity-only
animation: FlakeField (speckles sampled from real flake colorways — Coyote, Nightfall…),
PourDivider, ResinSwirl, GrindRing, ConcreteTexture, GlossSweep, line-art icons
(trowel, squeegee, flake chip).

## Homepage scroll moments (fire once, IntersectionObserver, reduced-motion-aware)

- Pour divider fills between Hero and EpoxyInfo.
- EpoxyInfo 4-step process becomes a self-building layer cross-section
  (grind → epoxy → flake → topcoat), replacing static epoxydiagram.jpg.
- Flake scatter-settle above FlakeCarousel.
- Gloss sweep across the Warranty badge. No looping hero animations (user feedback).

## Phasing

- **Phase 0**: tokens, accents, useScrollReveal upgrade, video posters (ffmpeg).
- **Phase 1**: shell (Header/Footer/StickyCallButton) + all 7 home sections +
  index.html cleanup → pause for user browser review.
- **Phase 2**: remaining pages (commercial, garagemakeover, patios, colors,
  polished-concrete, radon, careers, 3 location pages, thank-you, 404).
- **Phase 3**: build + prerender diff checks (title/canonical/JSON-LD per route),
  Lighthouse vs baseline, contrast audit, form/analytics smoke test.
