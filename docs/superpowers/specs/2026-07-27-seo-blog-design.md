# Next Level SEO Blog — Phase 2 design

**Date:** 2026-07-27. Codifies the phase-2 sketch from `2026-07-20-nextjs-migration-design.md` §10 (all product decisions there were Bo's; this spec fixes the implementation shape). Trigger: SC-driven SEO pass showed informational queries ("how much does epoxy flooring cost", system-comparison searches) with zero content targeting them; blog is the standing lever for those + fresh-content signals.

## Shape

- **Storage:** MySQL `posts` table in the existing `nextlevel-crm` DB (same creds the Express API already uses). Columns: `id`, `slug` (unique), `title`, `description` (meta), `hero_image` (path into the existing `public/images` library), `body_html` (sanitized server-side render of the generator's markdown), `topic_kind` (`local` | `informational`), `status` (`published` | `draft`), `published_at`, `created_at`.
- **API:** two public Express routes on :4242 — `GET /api/blog` (published list, newest first) and `GET /api/blog/:slug`. No admin CRUD in v1 (posts come from the generator or seeds; corrections via SQL).
- **Pages:** `app/blog/page.js` (index) + `app/blog/[slug]/page.js`, both ISR (`revalidate: 3600`), fetching `http://127.0.0.1:4242/api/blog[...]` at render time. Styling matches the site system (styled-components, dark + resin palette). Per-post `metadata` (title ≤60, description ≤160, canonical, `BlogPosting` JSON-LD referencing the site-wide `#business`).
- **Sitemap:** `src/routesManifest.js` already exports the async hook for dynamic routes — blog slugs + `published_at` lastmod flow into `app/sitemap.js` via a fetch to `/api/blog`. `/blog` index added as a static manifest row.
- **Generator:** `scripts/generate-blog-post.mjs`, run by **OS crontab on the EC2 box, Mondays 08:00 America/Denver**. Calls the Claude API (`claude-sonnet-5`, temperature default) with the content-rules prompt; alternates `local` / `informational` topics from a topic backlog table (`post_topics`: `id`, `topic`, `kind`, `used_at`); picks `hero_image` from a curated manifest of existing site photos; inserts as `published`; sends a "new post published" notification via the existing Resend setup to the owner. **Dormant guard:** if `ANTHROPIC_API_KEY` is unset, log one line and exit 0 — no email, no error.
- **Seeds:** 3 posts shipped at launch (written and human-reviewed in this repo — not API-generated), covering the highest-value informational queries from Search Console.

## Content rules (verbatim from the phase-2 sketch — enforced in the generator prompt AND on seed review)

- Never a street address.
- Warranty claims scoped exactly: lifetime warranty on **indoor** concrete Next Level prepares and installs.
- First-person Bo voice; intriguing, confident headings; unique non-templated text per post.
- No invented numbers, prices, or projects — only facts already published on the site (560+ floors, one-day residential installs, polyaspartic topcoats, service areas).
- Local + informational topic mix.

## Out of scope (v1)

Admin blog UI, comments, categories/tags, per-post OG images (site policy: single OG card after a prior de-indexing incident), AVIF.

## Rollout

Deploy ships table migration (idempotent `CREATE TABLE IF NOT EXISTS` run by the Express boot or a one-shot script), pages, seeds, and the generator script; crontab line installed manually over SSH (documented in deploy.sh header). Generator stays dormant until `ANTHROPIC_API_KEY` is added to `/home/ubuntu/nextlevel-crm/.env`.
