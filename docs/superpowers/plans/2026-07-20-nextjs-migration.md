# CRA → Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CRA + react-helmet + the puppeteer prerender pipeline with Next.js 16 App Router served by `next start` under PM2 behind nginx, preserving every URL and SEO signal byte-for-byte, with the Express CRM API untouched — the prerequisite for the phase-2 automated blog.

**Architecture:** Thin server `page.js` files (metadata + JSON-LD) render the existing `src/` components (marked `'use client'`); a `(public)` route group carries the marketing chrome; admin stays a client-only react-router SPA in an optional catch-all; sitemap/robots generate from a single route manifest. Cutover is staged: Next runs on :3000 beside the live static site, an SEO parity harness diffs it against a committed production baseline, and one nginx edit (with instant rollback) flips traffic.

**Tech Stack:** Next.js ^16.2, React 19, styled-components 6 (SWC compiler), react-router-dom (admin SPA only), Express/MySQL unchanged, PM2 + nginx on EC2, jest 27 + Playwright, plain-Node SEO parity tooling.

**Version note:** the spec names Next.js 15; superseded at planning time by next@^16.2.10 (needs Node ≥ 20.9 — laptop is on Node 24; EC2 is upgraded to Node 20 LTS in Task 22 before any Next process runs there).

**Spec:** `docs/superpowers/specs/2026-07-20-nextjs-migration-design.md`

---

## Chunk 1: Baseline & safety rails

**Context for the executor.** Repo `/Users/boshao/projects/nextlevel` is a CRA site (react-scripts 5) + Express API (`server/`, port 4242) + admin SPA, deployed to EC2 (`ubuntu@3.143.4.46`, key `/Users/boshao/Downloads/nextlevel.pem`). SEO today comes from a puppeteer prerender step (`scripts/prerender.js`, runs as `postbuild`) that bakes react-helmet output into static `build/<route>/index.html` files served by nginx. This chunk (Tasks 1–5) does NO Next.js work — it locks in a clean starting state and builds the measurement instrument (the SEO parity harness) that gates the entire migration: nginx is never flipped until `compare` passes against the baseline captured here.

Everything in Tasks 1–2 happens on `main`. Tasks 3–5 happen on the new `nextjs-migration` branch.

---

### Task 1: Commit the dirty working tree (2026-07-09 security pass + Turnstile removal)

The working tree carries two uncommitted bodies of work: the 2026-07-09 security hardening (login crash/oracle fix, login rate-limit, error handler, timesheet authz, gtag route-gating in `public/index.html`, pdfjs `isEvalSupported:false`) and the 2026-07-18 Turnstile removal from all three lead forms (owner decision — never reject a real customer). They ship on any deploy regardless; make it one deliberate commit on `main` before any migration work.

- [ ] **Step 1: Verify the dirty file list is exactly the expected 11 files**

  ```bash
  cd /Users/boshao/projects/nextlevel && git status --porcelain --untracked-files=no
  ```

  Expected output (exactly these 11 lines, all ` M`; any `??` untracked lines — e.g. session docs — are excluded by the flag and are out of scope for this task):

  ```
   M public/index.html
   M server/index.js
   M server/routes/auth.js
   M server/routes/leads.js
   M server/routes/timesheet.js
   M server/services/email.js
   M src/Careers.jsx
   M src/Commercial.jsx
   M src/ContactForm.jsx
   M src/Privacy.jsx
   M src/components/PdfPreview.jsx
  ```

  If ANY other file shows up, stop and ask Bo — do not commit strays.

- [ ] **Step 2: Sanity-run the server tests before committing**

  ```bash
  npm run test:server
  ```

  Expected output (jest 27, currently hoisted from react-scripts — Task 4 makes it explicit):

  ```
  PASS server/util/documentStorage.test.js
  PASS server/config/payPeriods.test.js

  Test Suites: 2 passed, 2 total
  ```

  (Test counts/order may vary; both suites must be green.)

- [ ] **Step 3: Commit all 11 files as one commit on main**

  ```bash
  git add public/index.html server/index.js server/routes/auth.js server/routes/leads.js server/routes/timesheet.js server/services/email.js src/Careers.jsx src/Commercial.jsx src/ContactForm.jsx src/Privacy.jsx src/components/PdfPreview.jsx
  git commit -m "$(cat <<'EOF'
  fix(security)+feat(leads): 2026-07-09 hardening pass + remove Turnstile gate (owner decision 2026-07-18)

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  git status --porcelain --untracked-files=no
  ```

  Expected: commit succeeds (`11 files changed`), and the final `git status --porcelain --untracked-files=no` prints **nothing** (no tracked modifications; `??` untracked lines, if any, are out of scope for this task).

---

### Task 2: Deploy the current site with the CURRENT deploy.sh

> ⚠️ **HUMAN CHECKPOINT:** confirm with Bo before running this task.

This puts the just-committed security fixes live BEFORE the migration starts, and — critically — makes production match the code the parity baseline (Task 5) will be snapshotted from. The current `deploy.sh` builds the CRA app locally (triggers the puppeteer prerender — needs local Chrome and the gitignored media folders), rsyncs to EC2, copies into the nginx web root, and restarts `nextlevel-api`.

- [ ] **Step 1: Preflight — confirm gitignored media is present locally (the build embeds it)**

  ```bash
  cd /Users/boshao/projects/nextlevel
  ls src/images | head -3 && ls public/videos | head -3 && ls public/images | wc -l
  ```

  Expected: each `ls` prints real filenames (non-empty). If `src/images/` or `public/videos/` is empty the prerendered pages will ship broken media — stop and restore the media first.

- [ ] **Step 2: Run the existing deploy script**

  ```bash
  ./deploy.sh
  ```

  Expected output shape (CRA build output + per-route prerender logs elided):

  ```
  🔨 Building React app...
  ...
  📦 Syncing build → EC2 (delta-only, resumable)...
  📦 Syncing server → EC2...
  📦 Syncing package files → EC2...
  📦 Installing server deps on EC2 (no-op if lockfile unchanged)...
  🔄 Copying to Nginx root & restarting API...
  Done!
  ✅ Deploy complete — https://nextlevelepoxynm.com
  ```

  Known flake: rsync occasionally stalls — rerun `./deploy.sh`; `--partial` resumes.

- [ ] **Step 3: Verify the deploy landed**

  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' https://www.nextlevelepoxynm.com/
  curl -s https://www.nextlevelepoxynm.com/api/health
  curl -s https://www.nextlevelepoxynm.com/ | grep -c "indexOf('/sign')"
  curl -s https://www.nextlevelepoxynm.com/ | grep -c 'challenges.cloudflare.com'
  ```

  Expected, line by line:

  ```
  200
  {"status":"ok"}
  1
  0
  ```

  Line 3 = the NEW route-gated gtag loader is live (that string only exists in the 2026-07-09 version of `public/index.html`). Line 4 = Turnstile is gone from the prerendered home page. (`grep -c` exits 1 when the count is 0 — that exit code is fine, the printed `0` is the check.)

- [ ] **Step 4: No commit** — this task changes no files in the repo.

---

### Task 3: Create the migration branch

All migration work (Tasks 4–27) happens on a feature branch per repo norms. (A git worktree is optional if you want `main` checked out in parallel — see the `superpowers:using-git-worktrees` skill; plain branching is fine.)

- [ ] **Step 1: Branch off the freshly deployed main**

  ```bash
  cd /Users/boshao/projects/nextlevel
  git checkout -b nextjs-migration
  git branch --show-current
  ```

  Expected output:

  ```
  Switched to a new branch 'nextjs-migration'
  nextjs-migration
  ```

- [ ] **Step 2: No commit** — branch creation only.

---

### Task 4: Make jest an explicit devDependency

**Repo fact:** `npm run test:server` invokes a `jest` binary (v27.5.1) that exists only as a *transitive* dependency of react-scripts — there is no `jest` entry anywhere in `package.json` and no jest config file. When Task 26 removes react-scripts, the test suite would silently vanish. Pin jest explicitly NOW, before any dependency surgery, and prove the suite still runs.

- [ ] **Step 1: Install jest as an explicit devDependency (same major/minor as the hoisted one)**

  ```bash
  cd /Users/boshao/projects/nextlevel
  npm install --save-dev "jest@^27.5.1"
  node -e "console.log(require('./package.json').devDependencies.jest)"
  node_modules/.bin/jest --version
  ```

  Expected (npm's added/changed counts may vary since 27.5.1 is already in the tree):

  ```
  ^27.5.1
  27.5.1
  ```

- [ ] **Step 2: Verify test:server is still green immediately after**

  ```bash
  npm run test:server
  ```

  Expected:

  ```
  PASS server/util/documentStorage.test.js
  PASS server/config/payPeriods.test.js

  Test Suites: 2 passed, 2 total
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add package.json package-lock.json
  git commit -m "$(cat <<'EOF'
  chore(test): pin jest@27 as explicit devDependency before react-scripts removal

  test:server currently borrows the jest binary hoisted from react-scripts'
  transitive deps; removing react-scripts later would silently kill the suite.

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

  Expected: `2 files changed`.

---

### Task 5: SEO parity harness (lib + CLI + tests) + production baseline snapshot

The harness is **permanent tooling** and the migration's cutover gate: `snapshot` records every SEO-relevant field for every route on the live site; `compare` re-crawls a target (local `next start`, EC2 staging port :3000, or the live site) and exits non-zero on any diff not in an explicit allowlist. Plain Node ≥ 18 (global `fetch`), zero new dependencies, regex/string extraction — no puppeteer, no DOM library.

Three files: `scripts/seo-parity.lib.js` (pure extraction/diff functions — unit-tested, TDD), `scripts/seo-parity.js` (CLI: crawl + snapshot/compare), `scripts/seo-parity-allowlist.json` (known-intentional diffs). Baseline lands at `docs/seo-baseline.json` (committed).

Two live-prod facts discovered while designing this task (verified 2026-07-20 with curl), baked into the probe design below:

1. `/sign/<anything>` today serves the SPA shell — which after prerendering is the **home page HTML** (home title, home H1, home JSON-LD) with HTTP 200. So content fields are meaningless for the `/sign` probe; only status (+redirect) parity matters there.
2. The nginx `location ^~ /sign/` sets `X-Robots-Tag: noindex, nofollow` — but its `try_files` fallback internally redirects to `/index.html`, which is handled by `location /`, whose `add_header X-Robots-Tag $robots_tag always` wins: the live response header is actually **`X-Robots-Tag: all`**. The intended `/sign` noindex never reaches clients today. Under Next, `/sign/[token]` gets a real `noindex` robots meta (Task 15) — an intentional *improvement*, so `noindex` for this probe goes in the allowlist from day one.

- [ ] **Step 1: Write the unit test for the extraction library (TDD — fails first)**

  Create `scripts/seo-parity.test.js` (complete file):

  ```js
  'use strict';

  const {
    decodeEntities,
    extractTitle,
    extractMetaContent,
    extractCanonical,
    extractFirstH1,
    extractJsonLd,
    extractHtmlLang,
    extractSeoFields,
    normalizeRedirectLocation,
    stableStringify,
    diffRoute,
  } = require('./seo-parity.lib');

  // Fixture mimicking a puppeteer-prerendered CRA page: react-helmet attrs,
  // HTML entities in text, duplicate og:image (index.html base + helmet page
  // tag), unsorted JSON-LD keys, styled-components class junk on the H1.
  const PAGE = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<title>Epoxy Patio Coatings Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level</title>',
    '<meta name="description" content="UV-resistant epoxy patio coatings. Free quote: 505-352-4674." data-react-helmet="true"/>',
    '<link rel="canonical" href="https://www.nextlevelepoxynm.com/patios"/>',
    '<meta property="og:title" content="Epoxy Patio Coatings Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level"/>',
    '<meta property="og:url" content="https://www.nextlevelepoxynm.com/patios"/>',
    '<meta property="og:type" content="website"/>',
    '<meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg"/>',
    '<meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg"/>',
    '<meta name="twitter:card" content="summary_large_image"/>',
    '<meta name="robots" content="noindex,follow"/>',
    '<script type="application/ld+json">{"@type":"Service","name":"Patio Coatings","provider":{"@type":"LocalBusiness","name":"Next Level Epoxy Flooring"}}</script>',
    '<script data-react-helmet="true" type="application/ld+json">{"name":"Patio Coatings","@type":"Service","provider":{"name":"Next Level Epoxy Flooring","@type":"LocalBusiness"}}</script>',
    '</head>',
    '<body>',
    '<h1 class="sc-dGJTGW IOmJT">UV-Stable <em>Patio</em>&nbsp;Coatings</h1>',
    '<h1>Second heading ignored</h1>',
    '<svg><title>decorative svg title ignored</title></svg>',
    '</body></html>',
  ].join('\n');

  test('decodeEntities handles named and numeric entities', () => {
    expect(decodeEntities('Fe &amp; Rio &#x27;x&#39; &quot;q&quot;')).toBe('Fe & Rio \'x\' "q"');
  });

  test('extractTitle returns the first <title>, entity-decoded', () => {
    expect(extractTitle(PAGE)).toBe(
      'Epoxy Patio Coatings Albuquerque, Santa Fe & Rio Rancho NM | Next Level'
    );
  });

  test('extractTitle returns null when absent', () => {
    expect(extractTitle('<html><head></head><body></body></html>')).toBeNull();
  });

  test('extractMetaContent reads name= metas regardless of attr order/extra attrs', () => {
    expect(extractMetaContent(PAGE, 'name', 'description')).toBe(
      'UV-resistant epoxy patio coatings. Free quote: 505-352-4674.'
    );
  });

  test('extractMetaContent returns null for a missing meta', () => {
    expect(extractMetaContent(PAGE, 'name', 'twitter:title')).toBeNull();
  });

  test('identical duplicate metas dedupe to one value', () => {
    expect(extractMetaContent(PAGE, 'property', 'og:image')).toBe(
      'https://www.nextlevelepoxynm.com/images/og-image.jpg'
    );
  });

  test('DISTINCT duplicate metas are surfaced joined (duplicate-tag bug class)', () => {
    const dup = '<meta property="og:title" content="A"/><meta property="og:title" content="B"/>';
    expect(extractMetaContent(dup, 'property', 'og:title')).toBe('A | B');
  });

  test('extractCanonical reads link rel=canonical', () => {
    expect(extractCanonical(PAGE)).toBe('https://www.nextlevelepoxynm.com/patios');
  });

  test('robots meta is normalized (spacing/case) via extractSeoFields', () => {
    expect(extractSeoFields(PAGE).robots).toBe('noindex, follow');
  });

  test('extractFirstH1 takes first h1 only, strips inner tags, decodes entities', () => {
    expect(extractFirstH1(PAGE)).toBe('UV-Stable Patio Coatings');
  });

  test('extractHtmlLang reads the html lang attribute', () => {
    expect(extractHtmlLang(PAGE)).toBe('en');
  });

  test('extractJsonLd canonicalizes: key order never matters, output is sorted', () => {
    const scripts = extractJsonLd(PAGE);
    expect(scripts).toHaveLength(2);
    expect(scripts[0]).toBe(scripts[1]); // same schema, different key order
    expect(scripts[0]).toContain('"@type":"Service"');
  });

  test('extractJsonLd records unparseable blocks instead of throwing', () => {
    const bad = '<script type="application/ld+json">{oops</script>';
    const scripts = extractJsonLd(bad);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toContain('parseError');
  });

  test('extractSeoFields fills the full shape with null for absent fields', () => {
    const f = extractSeoFields(PAGE);
    expect(f.ogType).toBe('website');
    expect(f.twitterCard).toBe('summary_large_image');
    expect(f.ogDescription).toBeNull();
    expect(f.twitterImage).toBeNull();
  });

  test('normalizeRedirectLocation strips the crawl origin, keeps foreign origins', () => {
    const base = 'https://www.nextlevelepoxynm.com';
    expect(normalizeRedirectLocation('https://www.nextlevelepoxynm.com/garagemakeover', base)).toBe('/garagemakeover');
    expect(normalizeRedirectLocation('/garagemakeover', base)).toBe('/garagemakeover');
    expect(normalizeRedirectLocation('https://elsewhere.example/x', base)).toBe('https://elsewhere.example/x');
    expect(normalizeRedirectLocation(null, base)).toBeNull();
  });

  test('stableStringify sorts object keys recursively', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  test('diffRoute: identical records produce no diffs', () => {
    const rec = { status: 200, title: 'X', jsonLd: ['{"a":1}'] };
    expect(diffRoute('/x', rec, { ...rec }, {}, undefined)).toEqual([]);
  });

  test('diffRoute: reports diffs and marks allowlisted fields', () => {
    const baseline = { status: 200, title: 'Page Not Found | Next Level Epoxy' };
    const current = { status: 404, title: 'Page Not Found | Next Level Epoxy' };
    const diffs = diffRoute('/404', baseline, current, { '/404': { status: true } }, undefined);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ route: '/404', field: 'status', baseline: 200, current: 404, allowlisted: true });
  });

  test('diffRoute: restricted compareFields ignores everything else', () => {
    const baseline = { status: 200, title: 'home shell title', h1: 'home h1' };
    const current = { status: 200, title: 'Sign your document', h1: 'Sign here' };
    expect(diffRoute('/sign/x', baseline, current, {}, ['status', 'redirectLocation', 'noindex'])).toEqual([]);
  });
  ```

- [ ] **Step 2: Run the test — expect FAIL (module does not exist yet)**

  ```bash
  cd /Users/boshao/projects/nextlevel
  npx jest scripts/seo-parity.test.js
  ```

  Expected failure:

  ```
  FAIL scripts/seo-parity.test.js
    ● Test suite failed to run

      Cannot find module './seo-parity.lib' from 'scripts/seo-parity.test.js'
  ```

- [ ] **Step 3: Write the extraction library**

  Create `scripts/seo-parity.lib.js` (complete file):

  ```js
  /*
   * seo-parity.lib.js — pure extraction/diff functions for the SEO parity
   * harness (scripts/seo-parity.js). Zero dependencies; unit-tested by
   * scripts/seo-parity.test.js. Regex-based on purpose: both HTML sources we
   * ever parse (puppeteer page.content() captures and Next.js SSR output)
   * emit fully-quoted attributes, so an HTML parser dependency buys nothing.
   */
  'use strict';

  const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

  function decodeEntities(str) {
    if (str == null) return str;
    return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, code) => {
      if (code[0] === '#') {
        const n = code[1] === 'x' || code[1] === 'X'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
        return Number.isNaN(n) ? m : String.fromCodePoint(n);
      }
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, code) ? NAMED_ENTITIES[code] : m;
    });
  }

  function collapseWs(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  // Parse `attr="value"` / `attr='value'` pairs from a single opening tag.
  function parseAttrs(tag) {
    const attrs = {};
    const re = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = re.exec(tag)) !== null) {
      attrs[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
    }
    return attrs;
  }

  // All opening tags of tagName as attr maps, in document order.
  function findTags(html, tagName) {
    const re = new RegExp('<' + tagName + '\\b[^>]*>', 'gi');
    const out = [];
    let m;
    while ((m = re.exec(html)) !== null) out.push(parseAttrs(m[0]));
    return out;
  }

  function extractTitle(html) {
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    return m ? collapseWs(decodeEntities(m[1])) : null;
  }

  // Meta content selected by attrKey ('name'|'property') = attrValue.
  // Identical duplicates collapse to one value; DISTINCT duplicates are joined
  // with ' | ' so the duplicate-tag bug class (past de-indexing incident)
  // surfaces as a visible diff instead of being masked.
  function extractMetaContent(html, attrKey, attrValue) {
    const values = [];
    for (const attrs of findTags(html, 'meta')) {
      if ((attrs[attrKey] || '').toLowerCase() === attrValue.toLowerCase() && attrs.content !== undefined) {
        const v = collapseWs(decodeEntities(attrs.content));
        if (!values.includes(v)) values.push(v);
      }
    }
    return values.length === 0 ? null : values.join(' | ');
  }

  function extractCanonical(html) {
    const values = [];
    for (const attrs of findTags(html, 'link')) {
      if ((attrs.rel || '').toLowerCase() === 'canonical' && attrs.href) {
        const v = decodeEntities(attrs.href);
        if (!values.includes(v)) values.push(v);
      }
    }
    return values.length === 0 ? null : values.join(' | ');
  }

  function extractFirstH1(html) {
    const m = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (!m) return null;
    return collapseWs(decodeEntities(m[1].replace(/<[^>]+>/g, ' ')));
  }

  function extractHtmlLang(html) {
    const m = /<html\b[^>]*>/i.exec(html);
    return m ? parseAttrs(m[0]).lang || null : null;
  }

  // Every JSON-LD script, parsed and canonicalized (sorted keys) so key order
  // never causes a false diff; the result array is sorted so script order
  // never causes one either. Unparseable blocks become {parseError:...}.
  function extractJsonLd(html) {
    const out = [];
    const re = /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const raw = m[1].trim();
      try {
        out.push(stableStringify(JSON.parse(raw)));
      } catch (e) {
        out.push(stableStringify({ parseError: true, raw: raw.slice(0, 120) }));
      }
    }
    out.sort();
    return out;
  }

  // 'noindex,follow' and 'noindex, follow' must compare equal.
  function normalizeRobots(value) {
    if (!value) return null;
    return value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).join(', ');
  }

  function extractSeoFields(html) {
    return {
      htmlLang: extractHtmlLang(html),
      title: extractTitle(html),
      metaDescription: extractMetaContent(html, 'name', 'description'),
      canonical: extractCanonical(html),
      robots: normalizeRobots(extractMetaContent(html, 'name', 'robots')),
      ogTitle: extractMetaContent(html, 'property', 'og:title'),
      ogDescription: extractMetaContent(html, 'property', 'og:description'),
      ogUrl: extractMetaContent(html, 'property', 'og:url'),
      ogImage: extractMetaContent(html, 'property', 'og:image'),
      ogType: extractMetaContent(html, 'property', 'og:type'),
      twitterCard: extractMetaContent(html, 'name', 'twitter:card'),
      twitterTitle: extractMetaContent(html, 'name', 'twitter:title'),
      twitterDescription: extractMetaContent(html, 'name', 'twitter:description'),
      twitterImage: extractMetaContent(html, 'name', 'twitter:image'),
      h1: extractFirstH1(html),
      jsonLd: extractJsonLd(html),
    };
  }

  // nginx 301s to the absolute www URL; next.config.js redirects() emits a
  // path. Strip the crawl origin so both compare as '/garagemakeover'.
  function normalizeRedirectLocation(location, baseOrigin) {
    if (!location) return null;
    if (baseOrigin && location.startsWith(baseOrigin)) {
      const rest = location.slice(baseOrigin.length);
      return rest === '' ? '/' : rest;
    }
    return location;
  }

  function sortValue(v) {
    if (Array.isArray(v)) return v.map(sortValue);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v).sort()) o[k] = sortValue(v[k]);
      return o;
    }
    return v === undefined ? null : v;
  }

  function stableStringify(value) {
    return JSON.stringify(sortValue(value));
  }

  // Fields compared by default. 'xRobotsTag' is deliberately NOT here: the
  // header is added by nginx, so a bare `next start` on :3000 legitimately
  // differs. It is still recorded in snapshots for eyeballing. 'noindex' is
  // derived (robots meta OR X-Robots-Tag contains 'noindex') so header-based
  // and meta-based noindex compare equal.
  const COMPARE_FIELDS = [
    'status', 'redirectLocation', 'htmlLang', 'title', 'metaDescription',
    'canonical', 'robots', 'noindex', 'ogTitle', 'ogDescription', 'ogUrl',
    'ogImage', 'ogType', 'twitterCard', 'twitterTitle', 'twitterDescription',
    'twitterImage', 'h1', 'jsonLd',
  ];

  function diffRoute(routePath, baselineRec, currentRec, allowlist, compareFields) {
    const fields = compareFields || COMPARE_FIELDS;
    const allowed = (allowlist && allowlist[routePath]) || {};
    const a = baselineRec || {};
    const b = currentRec || {};
    const diffs = [];
    for (const field of fields) {
      if (stableStringify(a[field]) !== stableStringify(b[field])) {
        diffs.push({
          route: routePath,
          field,
          baseline: a[field],
          current: b[field],
          allowlisted: allowed[field] === true,
        });
      }
    }
    return diffs;
  }

  module.exports = {
    decodeEntities,
    collapseWs,
    parseAttrs,
    findTags,
    extractTitle,
    extractMetaContent,
    extractCanonical,
    extractFirstH1,
    extractHtmlLang,
    extractJsonLd,
    normalizeRobots,
    extractSeoFields,
    normalizeRedirectLocation,
    stableStringify,
    diffRoute,
    COMPARE_FIELDS,
  };
  ```

- [ ] **Step 4: Run the test again — expect PASS**

  ```bash
  npx jest scripts/seo-parity.test.js
  ```

  Expected:

  ```
  PASS scripts/seo-parity.test.js

  Test Suites: 1 passed, 1 total
  Tests:       19 passed, 19 total
  ```

- [ ] **Step 5: Fold the new tests into test:server**

  Edit `package.json`. Before (line 50):

  ```json
    "test:server": "jest --rootDir=. --testMatch \"**/server/**/*.test.js\" --watchAll=false",
  ```

  After:

  ```json
    "test:server": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --watchAll=false",
  ```

  (jest's testMatch uses micromatch — the `{server,scripts}` brace group is supported; the default `/node_modules/` ignore still applies. Task 20 later renames this to `test:node` and adds `src/admin` tests.)

- [ ] **Step 6: Run the combined suite — expect 3 suites green**

  ```bash
  npm run test:server
  ```

  Expected:

  ```
  PASS scripts/seo-parity.test.js
  PASS server/util/documentStorage.test.js
  PASS server/config/payPeriods.test.js

  Test Suites: 3 passed, 3 total
  ```

- [ ] **Step 7: Write the CLI**

  Create `scripts/seo-parity.js` (complete file):

  ```js
  #!/usr/bin/env node
  /*
   * seo-parity.js — SEO parity harness (PERMANENT tooling; the CRA→Next
   * migration cutover gate, kept afterwards as a regression check).
   *
   *   Snapshot the live site:
   *     node scripts/seo-parity.js snapshot https://www.nextlevelepoxynm.com docs/seo-baseline.json
   *   Compare a target against the baseline (exit 1 on non-allowlisted diff):
   *     node scripts/seo-parity.js compare http://127.0.0.1:3000 docs/seo-baseline.json scripts/seo-parity-allowlist.json
   *
   * Allowlist format: { "<route>": { "<field>": true } }
   * Requires Node >= 18 (global fetch). No dependencies.
   */
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const {
    extractSeoFields,
    normalizeRedirectLocation,
    diffRoute,
    COMPARE_FIELDS,
  } = require('./seo-parity.lib');

  // Frozen copy of the prerender allow-list (scripts/prerender.js:36-53),
  // captured here before that script is deleted in Task 26. This list is the
  // parity scope of the migration and must NOT grow — the phase-2 blog's
  // extension point is src/routesManifest.js (Task 16), not this file.
  const ROUTES = [
    '/',
    '/commercial',
    '/garagemakeover',
    '/patios',
    '/colors',
    '/polished-concrete',
    '/careers',
    '/radon',
    '/thank-you',
    '/snake',
    '/404',
    '/epoxy-flooring-albuquerque',
    '/epoxy-flooring-santa-fe',
    '/epoxy-flooring-rio-rancho',
    '/privacy',
    '/terms',
  ];

  const PROBES = [
    // Legacy alias redirects to the canonical no-hyphen URL. nginx answers
    // 301 today and keeps answering 301 in front after cutover; hitting
    // :3000 DIRECTLY, next.config.js `permanent: true` answers 308 — Task 18
    // allowlists that status diff (redirectLocation must still match).
    { path: '/garage-makeover', compareFields: ['status', 'redirectLocation'] },
    // Unknown URL must return a REAL HTTP 404 serving the branded NotFound
    // page — full field compare (both sides render the same component).
    { path: '/definitely-not-a-page-xyz' },
    // E-sign shell probe. Today nginx SPA-falls-back to the prerendered HOME
    // html with 200, so content fields are meaningless here; only
    // status/redirect/noindex are compared. ('noindex' is allowlisted from
    // day one: the live nginx noindex header for /sign/* is overridden to
    // "all" by the try_files internal redirect — Next fixes this for real.)
    { path: '/sign/dummy-token-parity', compareFields: ['status', 'redirectLocation', 'noindex'] },
  ];

  function routeSpecs() {
    return ROUTES.map((p) => ({ path: p })).concat(PROBES);
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function crawlRoute(base, spec) {
    const res = await fetch(base + spec.path, {
      redirect: 'manual',
      headers: { 'user-agent': 'nextlevel-seo-parity/1.0' },
    });
    const status = res.status;
    const redirectLocation = normalizeRedirectLocation(res.headers.get('location'), base);
    const xRobotsTag = res.headers.get('x-robots-tag') || null;
    let fields = {};
    if (redirectLocation) {
      await res.arrayBuffer().catch(() => {}); // drain body
    } else {
      fields = extractSeoFields(await res.text());
    }
    const noindex = /noindex/i.test(fields.robots || '') || /noindex/i.test(xRobotsTag || '');
    return { status, redirectLocation, xRobotsTag, noindex, ...fields };
  }

  async function crawl(base) {
    const out = {};
    for (const spec of routeSpecs()) {
      const rec = await crawlRoute(base, spec);
      out[spec.path] = rec;
      console.log(`  GET ${spec.path} -> ${rec.status}${rec.redirectLocation ? ' ' + rec.redirectLocation : ''}`);
      await sleep(250);
    }
    return out;
  }

  function loadJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  function short(v) {
    const s = v === undefined ? 'undefined' : JSON.stringify(v);
    return s.length > 100 ? s.slice(0, 100) + '...' : s;
  }

  async function snapshot(base, outFile) {
    const routes = await crawl(base);
    const doc = { generatedAt: new Date().toISOString(), base, routes };
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(doc, null, 2) + '\n');
    console.log(`Snapshot: ${Object.keys(routes).length} routes -> ${outFile}`);
  }

  async function compare(base, baselineFile, allowlistFile) {
    const baseline = loadJson(baselineFile);
    const allowlist = allowlistFile ? loadJson(allowlistFile) : {};
    const current = await crawl(base);
    const specByPath = {};
    for (const s of routeSpecs()) specByPath[s.path] = s;

    let blocking = 0;
    let allowed = 0;
    console.log('');
    for (const route of Object.keys(baseline.routes)) {
      const spec = specByPath[route] || { path: route };
      const diffs = diffRoute(
        route, baseline.routes[route], current[route], allowlist,
        spec.compareFields || COMPARE_FIELDS
      );
      if (diffs.length === 0) {
        console.log(`ok      ${route}`);
        continue;
      }
      console.log(`==      ${route}`);
      for (const d of diffs) {
        if (d.allowlisted) {
          allowed += 1;
          console.log(`  ALLOWED ${d.field}: ${short(d.baseline)} -> ${short(d.current)}`);
        } else {
          blocking += 1;
          console.log(`  DIFF    ${d.field}: ${short(d.baseline)} -> ${short(d.current)}`);
        }
      }
    }
    const total = Object.keys(baseline.routes).length;
    console.log(`\n${total} routes, ${blocking} blocking diff(s), ${allowed} allowlisted diff(s)`);
    process.exit(blocking > 0 ? 1 : 0);
  }

  async function main() {
    if (typeof fetch !== 'function') {
      console.error(`Node >= 18 required (global fetch). Current: ${process.version}`);
      process.exit(2);
    }
    const [mode, target, file, allowlistFile] = process.argv.slice(2);
    const base = target ? target.replace(/\/+$/, '') : null;
    if (mode === 'snapshot' && base && file) return snapshot(base, file);
    if (mode === 'compare' && base && file) return compare(base, file, allowlistFile);
    console.error(
      'Usage:\n' +
      '  node scripts/seo-parity.js snapshot <baseUrl> <outFile>\n' +
      '  node scripts/seo-parity.js compare <baseUrl> <baselineFile> [allowlistFile]'
    );
    process.exit(2);
  }

  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
  ```

- [ ] **Step 8: Write the initial allowlist**

  Create `scripts/seo-parity-allowlist.json` (complete file):

  ```json
  {
    "/404": {
      "status": true,
      "title": true,
      "robots": true
    },
    "/sign/dummy-token-parity": {
      "noindex": true,
      "h1": true,
      "jsonLd": true
    }
  }
  ```

  Rationale, on record for Task 18: the literal `/404` URL serves HTTP 200 today (it's a prerendered page) but a real HTTP 404 under Next — intentional; its title/robots come from the not-found component and are allowlisted defensively. `/sign/dummy-token-parity`: `noindex` flips false→true because today's nginx noindex header is broken-by-internal-redirect (see task intro, fact 2) and Next emits a real robots meta — intentional improvement; `h1`/`jsonLd` are listed defensively should the compare scope for this probe ever widen.

- [ ] **Step 9: Smoke the CLI usage path**

  ```bash
  node scripts/seo-parity.js; echo "exit=$?"
  ```

  Expected:

  ```
  Usage:
    node scripts/seo-parity.js snapshot <baseUrl> <outFile>
    node scripts/seo-parity.js compare <baseUrl> <baselineFile> [allowlistFile]
  exit=2
  ```

- [ ] **Step 10: Snapshot production into the committed baseline**

  Precondition: Task 2's deploy is live (the baseline must capture the code that was just deployed, not stale prod). Quick guard — this string only exists post-deploy:

  ```bash
  curl -s https://www.nextlevelepoxynm.com/ | grep -c "indexOf('/sign')"
  ```

  Expected: `1`. Then snapshot:

  ```bash
  node scripts/seo-parity.js snapshot https://www.nextlevelepoxynm.com docs/seo-baseline.json
  ```

  Expected output (19 lines then the summary; every route 200 except the three annotated):

  ```
    GET / -> 200
    GET /commercial -> 200
    GET /garagemakeover -> 200
    GET /patios -> 200
    GET /colors -> 200
    GET /polished-concrete -> 200
    GET /careers -> 200
    GET /radon -> 200
    GET /thank-you -> 200
    GET /snake -> 200
    GET /404 -> 200
    GET /epoxy-flooring-albuquerque -> 200
    GET /epoxy-flooring-santa-fe -> 200
    GET /epoxy-flooring-rio-rancho -> 200
    GET /privacy -> 200
    GET /terms -> 200
    GET /garage-makeover -> 301 /garagemakeover
    GET /definitely-not-a-page-xyz -> 404
    GET /sign/dummy-token-parity -> 200
  Snapshot: 19 routes -> docs/seo-baseline.json
  ```

- [ ] **Step 11: Sanity-check the baseline contents**

  ```bash
  node -e "
  const b = require('./docs/seo-baseline.json').routes;
  console.log(b['/'].title);
  console.log(b['/garage-makeover'].status, b['/garage-makeover'].redirectLocation);
  console.log(b['/404'].status, '|', b['/404'].robots);
  console.log(b['/thank-you'].robots);
  console.log(b['/sign/dummy-token-parity'].status, b['/sign/dummy-token-parity'].noindex);
  console.log(b['/'].jsonLd.length, b['/epoxy-flooring-albuquerque'].jsonLd.length);
  console.log(b['/patios'].title);
  "
  ```

  Expected:

  ```
  Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy
  301 /garagemakeover
  200 | noindex, follow
  noindex, follow
  200 false
  1 2
  Epoxy Patio Coatings Albuquerque, Santa Fe & Rio Rancho NM | Next Level
  ```

  Line-by-line meaning: home title entity-decoded; the alias 301 normalized to a path; `/404` is 200 today with a normalized noindex,follow meta; `/thank-you` noindex captured; the `/sign` probe is 200 and NOT noindex today (nginx header bug — see task intro); home has 1 JSON-LD script (the base `@graph`) while location pages have 2 (base `@graph` + their Service/BreadcrumbList `@graph`); `/patios` title proves `&amp;` handling on a helmet-authored page. Any mismatch here means an extractor bug — fix it before committing (the whole migration measures itself against this file).

- [ ] **Step 12: Commit the harness + baseline**

  ```bash
  git add scripts/seo-parity.js scripts/seo-parity.lib.js scripts/seo-parity.test.js scripts/seo-parity-allowlist.json docs/seo-baseline.json package.json
  git commit -m "$(cat <<'EOF'
  feat(seo): parity harness (snapshot/compare) + production baseline

  Permanent tooling and the migration cutover gate: records status, redirect,
  title/meta/canonical/robots/og/twitter/H1/JSON-LD per route on prod and
  diffs any target against it; exit 1 on non-allowlisted drift. Baseline
  snapshotted from live prod post-deploy. test:server now also runs
  scripts/**/*.test.js.

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

  Expected: `6 files changed` (5 new files + package.json).

**Chunk 1 exit state:** `main` is clean and deployed; branch `nextjs-migration` carries an explicit jest devDep and a tested, committed parity harness with a fresh production baseline. Chunk 2 (Task 6) starts the actual Next.js scaffold on this branch.

## Chunk 2: Next.js scaffold

**Context.** This chunk runs entirely on the `nextjs-migration` branch (Task 3), laptop only — nothing here touches EC2 or production. After Chunk 1: dirty tree committed and deployed, `jest@^27.5.1` explicit devDependency, `test:server` runs the widened glob `**/{server,scripts}/**/*.test.js`, `docs/seo-baseline.json` + `scripts/seo-parity-allowlist.json` committed. The CRA build path (`react-scripts build` + puppeteer prerender) stays intact until Task 26 — it is main's production hotfix path; nothing in this chunk may break it.

Repo facts you need:

- `app/` goes at the **repo root** (not `src/app`); components stay in `src/`, imported via relative paths (`../../src/...`). No TypeScript, no path aliases.
- styled-components v6 does not work in React Server Components: **every component using styled-components (or any hook) that is reachable from a server file needs `'use client'` on line 1**. SSR styling flows through the registry created in Task 7.
- In prod, nginx proxies only `/api/*` to Express (127.0.0.1:4242); everything else will come from Next on :3000 after the Chunk 6 cutover. `rewrites()` in next.config.js exists purely so `next dev` reaches the local Express API without nginx. Laptop Node is v24 (Next 16 needs ≥20.9 — fine).
- **Metadata-merge fact (coordinates with Chunk 3):** Next does NOT deep-merge nested metadata — a page exporting `openGraph` REPLACES the root layout's `openGraph` wholesale. Today every rendered page carries the site-wide og:image/type/locale/site_name tags (from `public/index.html`). Task 7's root layout provides those defaults for pages exporting no `openGraph` at all (/thank-you, /snake, 404); Chunk 3's `src/seo.js` helper (Task 9) re-states the same fields on every page that sets og:title/description/url. Keep the two in sync if the social card ever changes.

---

### Task 6: Install next@16 / react@19, next.config.js, npm scripts

- [ ] **Step 1: Preconditions**

```bash
cd /Users/boshao/projects/nextlevel
git branch --show-current && git status --porcelain && node --version
# expect: nextjs-migration / no porcelain output (clean tree) / v24.x
```

- [ ] **Step 2: Create `.npmrc` (peer-dep bridge)**

react-scripts 5 and `@testing-library/*` declare `react@^18` peers; installing react 19 alongside them fails npm's default peer resolution with ERESOLVE. Until Task 26 deletes those packages, pin legacy peer resolution repo-wide.

Create `/Users/boshao/projects/nextlevel/.npmrc` (NEW file, complete):

```ini
# Temporary until Task 26 removes react-scripts + @testing-library (their
# react@^18 peers conflict with react 19). Committed so all installs agree.
# NOTE: deploy.sh v2 (Task 21) ships this file alongside package.json/
# package-lock.json so EC2's `npm install --omit=dev` resolves; Task 26
# deletes it (and drops it from the deploy rsync) once the react@18 peers go.
legacy-peer-deps=true
```

- [ ] **Step 3: Install the pinned versions**

```bash
npm install next@^16.2.10 react@^19 react-dom@^19
```

Expected: ends with `added <N> packages` / `changed <M> packages`, exit 0, **no ERESOLVE errors** (the `.npmrc` suppresses them). Deprecation warnings from transitive CRA packages are normal.

- [ ] **Step 4: Verify versions (expect PASS)**

```bash
npx next --version   # expect: Next.js v16.2.10 (or later 16.2.x)
node -p "[require('react/package.json').version, require('react-dom/package.json').version, require('styled-components/package.json').version].join(' ')"
# expect: 19.x.x 19.x.x 6.1.x   (styled-components unchanged)
```

- [ ] **Step 5: Create `next.config.js`**

Create `/Users/boshao/projects/nextlevel/next.config.js` (NEW file, complete):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle: deploy (Task 21) rsyncs .next/standalone to
  // EC2 and runs its server.js under PM2 — the box's node_modules serve only
  // the Express API, never the web app.
  output: 'standalone',
  poweredByHeader: false,
  compiler: {
    // Official styled-components transform: stable classnames + SSR support
    // (pairs with lib/StyledComponentsRegistry.jsx from Task 7).
    styledComponents: true,
  },
  async redirects() {
    return [
      // Old hyphenated URL. permanent:true emits HTTP 308 when :3000 is hit
      // directly; live nginx keeps answering 301 in front of it, and the
      // parity allowlist covers the direct-:3000 status difference (Task 18).
      { source: '/garage-makeover', destination: '/garagemakeover', permanent: true },
    ];
  },
  async rewrites() {
    // Dev convenience only (replaces CRA's "proxy" field): lets `next dev`
    // forward API calls to the local Express server. In prod nginx intercepts
    // /api/* before requests ever reach Next.
    return [
      { source: '/api/:path*', destination: 'http://127.0.0.1:4242/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 6: Add the Next npm scripts (CRA scripts untouched)**

Edit `/Users/boshao/projects/nextlevel/package.json`. The scripts block currently reads (as left by Task 5, which widened the `test:server` glob):

```json
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "react-scripts start",
    "build": "react-scripts build",
    "postbuild": "node scripts/prerender.js",
    "test": "react-scripts test",
    "test:server": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --watchAll=false",
    "eject": "react-scripts eject"
  },
```

Change to (three additions after `"client"`, nothing else changes — `build`/`postbuild` stay alive until Task 26 renames everything to the primary names):

```json
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "react-scripts start",
    "dev:next": "next dev",
    "build:next": "next build",
    "start:next": "next start",
    "build": "react-scripts build",
    "postbuild": "node scripts/prerender.js",
    "test": "react-scripts test",
    "test:server": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --watchAll=false",
    "eject": "react-scripts eject"
  },
```

Dev workflow from here on: terminal 1 `npm run server` (Express :4242), terminal 2 `npm run dev:next` (Next :3000, `/api/*` rewritten to :4242). Note: on this branch `npm run build` (CRA) now compiles against react 19 — no migration task uses it, and main keeps react 18 for hotfixes.

- [ ] **Step 7: Confirm `.next/` is already gitignored**

```bash
grep -n "^\.next/" .gitignore   # expect: 26:.next/   (no edit needed)
```

- [ ] **Step 8: Verify the jest surface survived the dep surgery (expect PASS)**

```bash
npm run test:server   # expect: all suites pass (server/config, server/util, scripts/seo-parity) — exit 0
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json next.config.js .npmrc
git commit -m "$(cat <<'EOF'
feat(next): scaffold Next 16.2 + react 19 — deps, next.config.js, scripts

react-router-dom stays (admin SPA); react-scripts/build path stays until
Task 26. .npmrc pins legacy-peer-deps while CRA-era react@18 peers remain.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: StyledComponentsRegistry + root layout + (public) layout + not-found.js

Builds the whole app-shell skeleton and proves it end-to-end with a `next dev` smoke check against the branded 404 (the only route that can render before any page exists). The Header/Footer/StickyCallButton chrome still uses react-router until Task 8, so the shared chrome component ships here with those slots stubbed; Task 8 fills them in.

- [ ] **Step 1: Create the styled-components SSR registry**

Create `/Users/boshao/projects/nextlevel/lib/StyledComponentsRegistry.jsx` (NEW file, complete — the standard pattern from the Next docs):

```jsx
'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

/**
 * Collects styled-components CSS generated during the server render and
 * injects it into the streamed <head>, so every page arrives fully styled
 * before any JS runs (replaces the prerender CSSOM-snapshot hack in
 * scripts/prerender.js). Pairs with compiler.styledComponents.
 */
export default function StyledComponentsRegistry({ children }) {
  // Lazy-init one sheet per request on the server.
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  // In the browser, styled-components manages its own stylesheet.
  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
```

- [ ] **Step 2: Create `src/structuredData.js` — base JSON-LD @graph**

Values copied VERBATIM from `public/index.html:42-105` (key order preserved; rating numbers stay strings). Create `/Users/boshao/projects/nextlevel/src/structuredData.js` (NEW file, complete):

```js
/**
 * Site-wide LocalBusiness + Service JSON-LD @graph (public/index.html:42-105),
 * rendered once in app/layout.js. The `#business` @id is referenced by the
 * location pages' Service schemas. POLICY: never add a street address.
 * JSON.stringify emits minified JSON vs. index.html's pretty-printed script —
 * the parity harness compares PARSED JSON-LD, so that is a non-diff.
 */
export const BUSINESS_GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://www.nextlevelepoxynm.com/#business',
      name: 'Next Level Epoxy Flooring',
      image: 'https://www.nextlevelepoxynm.com/nextlevellogo.png',
      logo: 'https://www.nextlevelepoxynm.com/nextlevellogo.png',
      url: 'https://www.nextlevelepoxynm.com',
      telephone: '+1-505-352-4674',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Albuquerque',
        addressRegion: 'NM',
        addressCountry: 'US',
      },
      areaServed: [
        { '@type': 'City', name: 'Albuquerque', containedInPlace: { '@type': 'State', name: 'New Mexico' } },
        { '@type': 'City', name: 'Santa Fe', containedInPlace: { '@type': 'State', name: 'New Mexico' } },
        { '@type': 'City', name: 'Rio Rancho', containedInPlace: { '@type': 'State', name: 'New Mexico' } },
      ],
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '16:00' },
      ],
      sameAs: ['https://www.instagram.com/nextlevelepoxynm'],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '47',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'Service',
      serviceType: 'Epoxy Garage Floor Coating',
      provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
      areaServed: ['Albuquerque, NM', 'Santa Fe, NM', 'Rio Rancho, NM'],
      url: 'https://www.nextlevelepoxynm.com/garagemakeover',
      description: 'Lifetime-warranty epoxy garage floor coatings installed in as little as one day. Custom colors, flake systems, polyaspartic topcoats.',
    },
    {
      '@type': 'Service',
      serviceType: 'Commercial Concrete Coatings',
      provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
      areaServed: ['Albuquerque, NM', 'Santa Fe, NM', 'Rio Rancho, NM'],
      url: 'https://www.nextlevelepoxynm.com/commercial',
      description: 'Heavy-duty commercial epoxy and polyaspartic floor systems for warehouses, restaurants, automotive shops, and industrial facilities.',
    },
    {
      '@type': 'Service',
      serviceType: 'Residential Epoxy Flooring',
      provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
      areaServed: ['Albuquerque, NM', 'Santa Fe, NM', 'Rio Rancho, NM'],
      url: 'https://www.nextlevelepoxynm.com/',
      description: 'Decorative epoxy and polyaspartic floors for garages, basements, and patios. Indoor concrete substrates only; lifetime warranty on Next Level installs.',
    },
  ],
};
```

- [ ] **Step 3: Create `src/GtagLoader.jsx` — GA4/Ads loader**

Reproduces the `public/index.html:125-140` IIFE semantics exactly: `window.gtag` defined unconditionally BEFORE the route gate (so `src/lib/analytics.js` helpers never throw on /admin or /sign), BOTH config IDs, async script injection. Mounted in the root layout, its effect runs once per full page load — not per client nav — matching today. Create `/Users/boshao/projects/nextlevel/src/GtagLoader.jsx` (NEW file, complete):

```jsx
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
```

- [ ] **Step 4: Make `GlobalStyle` a client component**

Edit `/Users/boshao/projects/nextlevel/src/GlobalStyle.jsx` — insert `'use client';` + blank line above line 1 (`import { createGlobalStyle } from 'styled-components';`). No other change. Why index.html's inline body `<style>` does NOT carry over: it was a pre-hydration FOUC guard for the CRA/prerender pipeline (the prerendered HTML could paint before the styled-components CSS attached). Under Next the StyledComponentsRegistry injects the styled-components CSS into the SSR HTML itself, so there is no unstyled window and the guard is unnecessary. GlobalStyle's `body { background-color: var(--white) }` remains the steady-state value exactly as today — dark surfaces come from page wrappers, not the body rule.

- [ ] **Step 5: Port `src/NotFound.jsx` off react-router/react-helmet**

Edit 5a — imports. Before (lines 1-4):

```jsx
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
```

After:

```jsx
'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
```

Edit 5b — head tags: React 19 hoists `<title>`/`<meta>` rendered anywhere in JSX into `<head>`, SSR included. Replace the Helmet block (lines 121-124):

```jsx
    <Helmet>
      <title>Page Not Found | Next Level Epoxy</title>
      <meta name="robots" content="noindex,follow" />
    </Helmet>
```

with the same two tags, un-wrapped:

```jsx
    <title>Page Not Found | Next Level Epoxy</title>
    <meta name="robots" content="noindex,follow" />
```

Edit 5c — buttons: next/link uses `href`, and router "state" doesn't exist in next/navigation — the cross-page contact scroll becomes a plain hash URL (mechanism completed in Task 8). Before (lines 136-139):

```jsx
        <PrimaryBtn to="/" state={{ scrollToContact: true }}>
          Get a Free Quote
        </PrimaryBtn>
        <SecondaryBtn to="/">Back to Home</SecondaryBtn>
```

After:

```jsx
        <PrimaryBtn href="/#contact">
          Get a Free Quote
        </PrimaryBtn>
        <SecondaryBtn href="/">Back to Home</SecondaryBtn>
```

- [ ] **Step 6: Create `src/PublicChrome.jsx` (chrome shell, v1)**

Port of `PublicLayout` (src/App.js:62-81). A separate component (not inlined in the layout file) because BOTH `app/(public)/layout.js` and `app/not-found.js` need it — `not-found.js` renders outside the `(public)` route group, but today's 404 shows the full marketing chrome and must keep it. Create `/Users/boshao/projects/nextlevel/src/PublicChrome.jsx` (NEW file, complete):

```jsx
'use client';

// Port of PublicLayout (src/App.js:62-81): the public marketing chrome.
// Used by app/(public)/layout.js AND app/not-found.js (the branded 404 keeps
// Header/Footer, matching today's PublicLayout-wrapped catch-all route).
// Task 8 wires in Header / Footer / StickyCallButton once they are ported
// off react-router.

import React from 'react';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures it takes up the full viewport height */
`;

const MainContent = styled.main`
  flex: 1; /* Ensures the main content stretches to fill available space */
`;

const PublicChrome = ({ children }) => (
  <LayoutContainer>
    {/* Task 8: <Header /> */}
    <MainContent>{children}</MainContent>
    {/* Task 8: <Footer /> and <StickyCallButton /> */}
  </LayoutContainer>
);

export default PublicChrome;
```

- [ ] **Step 7: Create the root layout**

html/body + fonts + registry + base metadata + base JSON-LD + GA4 loader ONLY — no page chrome. Poppins `<link>` tags copied exactly from `public/index.html:110-117`, rendered as JSX (React 19 hoists them into `<head>`). Create `/Users/boshao/projects/nextlevel/app/layout.js` (NEW file, complete):

```jsx
import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import GlobalStyle from '../src/GlobalStyle';
import GtagLoader from '../src/GtagLoader';
import { BUSINESS_GRAPH } from '../src/structuredData';

export const metadata = {
  metadataBase: new URL('https://www.nextlevelepoxynm.com'),
  // Base title (public/index.html:39). Pages override with absolute titles —
  // deliberately NOT a title template.
  title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy',
  // Site-wide keywords/author (public/index.html:18-22). No base description
  // exists today — do not add one.
  keywords:
    'epoxy flooring Albuquerque, epoxy flooring Santa Fe, epoxy flooring Rio Rancho, garage floor coating Albuquerque, concrete coatings New Mexico, polyaspartic flooring NM, commercial epoxy Albuquerque, residential epoxy Santa Fe',
  authors: [{ name: 'Next Level Epoxy Flooring' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/favicon-192.png', sizes: '192x192' }],
  },
  // Site-wide social card (public/index.html:27-36). Next metadata merging is
  // SHALLOW: any page exporting its own `openGraph`/`twitter` replaces these
  // objects entirely — src/seo.js (Task 9) re-states these exact fields on
  // every page that sets og:title/description/url. Pages with no openGraph
  // export (/thank-you, /snake, 404) inherit them from here. Keep this block
  // and src/seo.js's OG_DEFAULTS in sync.
  openGraph: {
    siteName: 'Next Level Epoxy Flooring',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.nextlevelepoxynm.com/images/og-image.jpg',
        type: 'image/jpeg',
        width: 1200,
        height: 630,
        alt: 'Next Level Epoxy Flooring — lifetime-warranty epoxy floors in Albuquerque, Santa Fe & Rio Rancho, NM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.nextlevelepoxynm.com/images/twitter-image.jpg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0e11',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Custom Fonts (public/index.html:110-117): preconnect + preload the
            H1/body weights so the font race isn't lost to the hero video; if
            Google bumps the font version these preloads become harmless
            no-ops and the stylesheet still wins. React 19 hoists the
            preconnect/preload links into <head> automatically; a
            <link rel="stylesheet"> is hoisted ONLY when it carries a
            `precedence` prop — hence precedence="default" below. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDD4Z1xlFd2JQEk.woff2"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
          precedence="default"
        />

        {/* Site-wide LocalBusiness + Service @graph (was public/index.html:42-105) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(BUSINESS_GRAPH) }}
        />

        <StyledComponentsRegistry>
          <GlobalStyle />
          {children}
        </StyledComponentsRegistry>

        <GtagLoader />
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create the `(public)` route-group layout**

Public pages (Chunk 3) live in `app/(public)/<route>/page.js` and get the chrome; `/admin`, `/sign`, `/signed` (Chunk 4) live outside the group and stay chrome-free — exactly today's PublicLayout boundary. Create `/Users/boshao/projects/nextlevel/app/(public)/layout.js` (NEW file, complete):

```jsx
import PublicChrome from '../../src/PublicChrome';

export default function PublicLayout({ children }) {
  return <PublicChrome>{children}</PublicChrome>;
}
```

- [ ] **Step 9: Create `app/not-found.js`**

Serves every unknown URL with a real HTTP 404 (replacing nginx's `error_page 404` + the prerendered /404 page). `app/(public)/404-page` is deliberately NOT created — the literal `/404` URL now correctly returns HTTP 404 and is already allowlisted in `scripts/seo-parity-allowlist.json` (Task 5). The `metadata.title` export mirrors the exact string NotFound renders in JSX so the head title is deterministic (the root default title would otherwise also appear); robots comes ONLY from NotFound's JSX `<meta>` to preserve today's exact `noindex,follow` string (Next's `robots` metadata object would render `noindex, follow` with a space).

Create `/Users/boshao/projects/nextlevel/app/not-found.js` (NEW file, complete):

```jsx
import PublicChrome from '../src/PublicChrome';
import NotFound from '../src/NotFound';

export const metadata = {
  title: 'Page Not Found | Next Level Epoxy',
};

export default function NotFoundPage() {
  return (
    <PublicChrome>
      <NotFound />
    </PublicChrome>
  );
}
```

- [ ] **Step 10: Smoke-check via `next dev` (this task's FAIL→PASS gate)**

```bash
cd /Users/boshao/projects/nextlevel
npm run dev:next > /tmp/next-dev.log 2>&1 &
until grep -q "Ready" /tmp/next-dev.log; do sleep 1; done
tail -3 /tmp/next-dev.log
# expect: ▲ Next.js 16.2.x (Turbopack) / - Local: http://localhost:3000 / ✓ Ready in <N>s
```

Probe an unknown URL (the only renderable route before Chunk 3):

```bash
curl -si http://localhost:3000/definitely-not-a-page-smoke | head -1
# expect: HTTP/1.1 404 Not Found

HTML=$(curl -s http://localhost:3000/definitely-not-a-page-smoke)
echo "$HTML" | grep -c '<title>Page Not Found | Next Level Epoxy</title>'
# expect: 1 (2 also fine — the JSX-hoisted copy is the identical string)
echo "$HTML" | grep -o 'name="robots" content="noindex,follow"' | head -1
# expect: name="robots" content="noindex,follow"
echo "$HTML" | grep -o 'property="og:site_name" content="Next Level Epoxy Flooring"'
# expect: one match (root OG defaults render)
echo "$HTML" | grep -o '"@id":"https://www.nextlevelepoxynm.com/#business"' | head -1
# expect: match (base JSON-LD)
echo "$HTML" | grep -o 'fonts.gstatic.com' | head -1
# expect: match (Poppins preconnect/preload hoisted)
echo "$HTML" | grep -o 'slipped through a crack' | head -1
# expect: match (NotFound body server-rendered)
echo "$HTML" | grep -o 'data-styled' | head -1
# expect: match (registry injected SSR styles — page styled without JS)
```

Verify the redirect config, then stop the server:

```bash
curl -si http://localhost:3000/garage-makeover | head -3
# expect: HTTP/1.1 308 Permanent Redirect + location: /garagemakeover
pkill -f "next dev" || true
```

If any grep fails, fix before committing — every string above exists in today's production output (except `data-styled`, which replaces the prerender CSS snapshot).

- [ ] **Step 11: Commit**

```bash
git add lib/StyledComponentsRegistry.jsx src/structuredData.js src/GtagLoader.jsx \
  src/PublicChrome.jsx src/GlobalStyle.jsx src/NotFound.jsx \
  app/layout.js "app/(public)/layout.js" app/not-found.js
git commit -m "$(cat <<'EOF'
feat(next): app shell — SC registry, root layout, (public) group, real 404

Root layout carries fonts/base metadata/base JSON-LD/GA4 loader only; the
marketing chrome lives in src/PublicChrome (shared with not-found so the
branded 404 keeps Header/Footer once Task 8 wires them). NotFound ported off
react-helmet/react-router; unknown URLs now return real HTTP 404.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Shared component router-port + contact-hash mechanism

Ports every shared (non-page) public component off react-router onto next/link + next/navigation, moves their bundler-imported images to `/public` string paths, and replaces the router-state contact-scroll with a plain `/#contact` hash. Page components (Commercial, Patios, LocationPage, AllColors, …) are deliberately NOT touched — each is ported in its own task (Tasks 9-13); edit only the named surface, per repo norms.

**Contact-hash mechanism (replaces `navigate('/', { state: { scrollToContact: true } })`):** cross-page "Contact" clicks become `router.push('/#contact')`. Next scrolls to the `#contact` element on arrival; `html { scroll-behavior: smooth }` (already in GlobalStyle) animates it. Header's `location.state` listener effect is deleted. Same-page clicks keep `document.getElementById('contact').scrollIntoView(...)` unchanged.

- [ ] **Step 1: Verify the hash mechanism's two prerequisites (expect PASS)**

```bash
grep -n 'id="contact"' src/ContactForm.jsx        # expect: 375:    <Section id="contact">
grep -n 'scroll-behavior: smooth' src/GlobalStyle.jsx  # expect: 92:    scroll-behavior: smooth;
```

- [ ] **Step 2: Port `src/Header.jsx`**

Edit 2a — imports. Before (lines 1-3):

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
```

After:

```jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
```

(The five `styled(Link)` factories at lines 43/101/215/240/311 — LogoLink, NavLink, MobileNavLink, MobileSubLink, TabItem — need no definition change; next/link renders an `<a>` and forwards className. Their `to=` props are swapped in Edit 2e.)

Edit 2b — hooks. Before (lines 353-354):

```jsx
  const navigate = useNavigate();
  const location = useLocation();
```

After:

```jsx
  const router = useRouter();
  const pathname = usePathname();
```

Edit 2c — contact click + DELETE the state-listener effect. Before (lines 385-397):

```jsx
  const handleContactClick = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollToContact: true } });
    } else {
      scrollToContact();
    }
  };

  useEffect(() => {
    if (location.state?.scrollToContact) scrollToContact();
  }, [location, scrollToContact]);
```

After (the second effect is gone entirely — the native hash replaces it):

```jsx
  const handleContactClick = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (pathname !== '/') {
      // Cross-page contact: hash navigation — Next scrolls to #contact on
      // arrival; html { scroll-behavior: smooth } animates it.
      router.push('/#contact');
    } else {
      scrollToContact();
    }
  };
```

Edit 2d — logo (line 402-404): `<LogoLink to="/">` keeps its `to=` for now (Edit 2e sweeps it); change the img src line from

```jsx
            src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}
```

to

```jsx
            src="/nextlevellogo.png"
```

Edit 2e — mechanical sweep: converts the remaining `location.pathname` reads (line 356 `isSubpage`, line 368 effect dep, lines 453-465 BottomTabBar `$active` props) to `pathname`, and all 22 `to="` link props to `href="`:

```bash
perl -pi -e 's/\blocation\.pathname\b/pathname/g; s/\bto="/href="/g' src/Header.jsx
```

Verify:

```bash
grep -c 'to="' src/Header.jsx         # expect: 0
grep -n 'location\.' src/Header.jsx   # expect: no output
grep -n 'react-router' src/Header.jsx # expect: no output
```

- [ ] **Step 3: Port `src/Footer.jsx` (+ codelabs logo to /public)**

Copy the bundled logo into the public tree (`public/images/*` is gitignored — the file stays local-only; deploy.sh v2 rsyncs `public/` to EC2 in Chunk 6, same as today's media handling):

```bash
mkdir -p public/images
cp src/images/codelabslogo.png public/images/codelabslogo.png
```

Edit 3a — imports. Before (lines 1-7):

```jsx
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaInstagram } from 'react-icons/fa';
import codelabsLogo from './images/codelabslogo.png';
import { FiPhone, FiMapPin } from 'react-icons/fi';
import { trackPhoneClick } from './lib/analytics';
```

After:

```jsx
'use client';

import React, { useCallback } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { FaInstagram } from 'react-icons/fa';
import { FiPhone, FiMapPin } from 'react-icons/fi';
import { trackPhoneClick } from './lib/analytics';
```

Edit 3b — brand logo (line 268): `src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}` → `src="/nextlevellogo.png"`.

Edit 3c — codelabs image (line 336): `<img src={codelabsLogo} alt="CodeLabs" />` → `<img src="/images/codelabslogo.png" alt="CodeLabs" />`.

Edit 3d — mechanical sweep for the 11 `to="` props (6 service links, 3 location links, 2 legal links):

```bash
perl -pi -e 's/\bto="/href="/g' src/Footer.jsx
grep -c 'to="' src/Footer.jsx         # expect: 0
grep -n 'react-router' src/Footer.jsx # expect: no output
```

(The `scrollToContact` callback at lines 257-260 and the CtaButton stay as-is — same-page scroll is still `getElementById`, and the `if (el)` guard already handles pages without a form.)

- [ ] **Step 4: Port `src/StickyCallButton.jsx`**

Edit 4a — add `'use client';` + blank line above line 1, and add `import { usePathname } from 'next/navigation';` after the styled-components import (line 2).

Edit 4b — replace the window-based route check. Before (lines 47-56):

```jsx
// Hide on admin routes by setting body data attribute from the layout. Until
// then we just check window.location at render time. Re-renders on each route
// change because parent re-renders.
function isAdminRoute() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
}

const StickyCallButton = () => {
  if (isAdminRoute()) return null;
```

After:

```jsx
// Belt-and-braces: the button only renders inside PublicChrome (never on
// /admin routes), but keep the guard SSR-safe via usePathname.
const StickyCallButton = () => {
  const pathname = usePathname();
  if (pathname && pathname.startsWith('/admin')) return null;
```

Verify: `grep -n 'window\.' src/StickyCallButton.jsx` — expect no output.

- [ ] **Step 5: Port `src/components/SwatchModal.jsx`**

Edit 5a — imports. Before (line 3): `import { useNavigate } from 'react-router-dom';` → add `'use client';` + blank line above line 1 and change line 3 to `import { useRouter } from 'next/navigation';`.

Edit 5b — hook (line 143): `const navigate = useNavigate();` → `const router = useRouter();`.

Edit 5c — quote handler. Before (lines 156-163):

```jsx
  const goQuote = () => {
    onClose();
    if (onQuote) {
      onQuote();
    } else {
      navigate('/', { state: { scrollToContact: true } });
    }
  };
```

After:

```jsx
  const goQuote = () => {
    onClose();
    if (onQuote) {
      onQuote();
    } else {
      router.push('/#contact');
    }
  };
```

Also update the JSDoc line 138-139 ("defaults to navigating home and scrolling to the contact form (Header listens for scrollToContact)") to say "defaults to navigating home via the /#contact hash".

- [ ] **Step 6: Port `src/FlakeCarousel.jsx` (router + media paths)**

Copy the 8 home-page swatch jpgs into the public tree (idempotent form — safe when Task 13's full media copy also runs later; gitignored-but-required-locally, same as today):

```bash
mkdir -p public/images/flakes
cp -R src/images/flakes/. public/images/flakes/
ls public/images/flakes | head -3   # expect jpg filenames, incl. coyote.jpg
```

Edit 6a — replace the whole import + data region (current lines 1-25: react-router `Link` import, the 8 jpg imports, and the `flakes` array using those bindings) with:

```jsx
'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import useScrollReveal from './useScrollReveal';

/* ── Data ─────────────────────────────────────────────────────────── */
/* Swatch jpgs are served from public/images/flakes (gitignored but required
   locally; deploy rsyncs public/). Task 13 builds the full /colors manifest
   from the same tree. */
const flakes = [
  { name: 'Coyote', img: '/images/flakes/coyote.jpg', popular: true },
  { name: 'Creekbed', img: '/images/flakes/creekbed.jpg' },
  { name: 'Gravel', img: '/images/flakes/gravel.jpg' },
  { name: 'Loon', img: '/images/flakes/loon.jpg' },
  { name: 'Nightfall', img: '/images/flakes/nightfall.jpg', popular: true },
  { name: 'Tidal Wave', img: '/images/flakes/tidal-wave.jpg' },
  { name: 'Thyme', img: '/images/flakes/thyme.jpg' },
  { name: 'Wombat', img: '/images/flakes/wombat.jpg' },
];
```

Edit 6b — "View All" button (line 211): `<ViewAllBtn to="/colors" onClick={() => window.scrollTo(0, 0)}>` → `<ViewAllBtn href="/colors" onClick={() => window.scrollTo(0, 0)}>` (the scrollTo stays — there is no automatic scroll reset on client navs, matching today).

- [ ] **Step 7: Port `src/components/LegalLayout.jsx`**

Add `'use client';` + blank line above line 1; change line 3 `import { Link } from 'react-router-dom';` → `import Link from 'next/link';`; change line 112 `<BackLink to="/">` → `<BackLink href="/">`.

- [ ] **Step 8: Add `'use client'` to the remaining shared home-section + accent components**

These have no router usage but use hooks and/or styled-components, and Chunk 3's server `page.js` files import them directly (the home page imports Hero/EpoxyInfo/Warranty/Gallery/Testimonials/ContactForm plus the accents barrel `src/accents/index.js` — the barrel evaluates every accents module on the server, so ALL accent components must be client). `src/useScrollReveal.js` itself needs no directive (its consumers carry it). Two preservation rules: ContactForm's `window.location.href = '/thank-you'` hard navigation on submit stays (full reload re-fires the AW- Ads config — do NOT change to router.push), and Hero's single universal poster `/videos/posters/hero.jpg` is a documented LCP decision — no edits to either beyond the directive.

```bash
cd /Users/boshao/projects/nextlevel
for f in src/Hero.jsx src/Gallery.jsx src/Testimonials.jsx src/Warranty.jsx \
         src/EpoxyInfo.jsx src/ContactForm.jsx \
         src/accents/PourDivider.jsx src/accents/ResinSwirl.jsx \
         src/accents/FlakeField.jsx src/accents/GlossSweep.jsx \
         src/accents/GrindRing.jsx src/accents/ConcreteTexture.jsx \
         src/accents/icons.jsx; do
  printf "'use client';\n\n%s" "$(cat "$f")" > "$f"
done
head -1 src/Hero.jsx src/ContactForm.jsx src/accents/ResinSwirl.jsx
# expect each: 'use client';
```

Notes: `src/EpoxyInfo.jsx` still imports `./images/epoxydiagram.jpg` — that swap happens in Task 9 with the home-page port (no route renders it until then, so dev stays green). `src/Commercial.jsx` also consumes useScrollReveal but is a page — it gets its directive in Task 10.

- [ ] **Step 9: Wire the chrome into `src/PublicChrome.jsx`**

Add after the styled-components import:

```jsx
import Header from './Header';
import Footer from './Footer';
import StickyCallButton from './StickyCallButton';
```

and replace the stubbed body. Before:

```jsx
const PublicChrome = ({ children }) => (
  <LayoutContainer>
    {/* Task 8: <Header /> */}
    <MainContent>{children}</MainContent>
    {/* Task 8: <Footer /> and <StickyCallButton /> */}
  </LayoutContainer>
);
```

After:

```jsx
const PublicChrome = ({ children }) => (
  <LayoutContainer>
    <Header />
    <MainContent>{children}</MainContent>
    <Footer />
    <StickyCallButton />
  </LayoutContainer>
);
```

Also delete the header-comment sentence "Task 8 wires in Header / Footer / StickyCallButton once they are ported off react-router."

- [ ] **Step 10: SSR smoke — no react-router left, full chrome renders**

```bash
grep -rn "react-router\|PUBLIC_URL" src/Header.jsx src/Footer.jsx \
  src/StickyCallButton.jsx src/components/SwatchModal.jsx src/FlakeCarousel.jsx \
  src/components/LegalLayout.jsx src/NotFound.jsx src/PublicChrome.jsx
# expect: no output

npm run dev:next > /tmp/next-dev.log 2>&1 &
until grep -q "Ready" /tmp/next-dev.log; do sleep 1; done

HTML=$(curl -s http://localhost:3000/definitely-not-a-page-smoke)
echo "$HTML" | grep -o '505-352-4674' | wc -l
# expect: >= 3 (header desktop + mobile menu + footer contact)
echo "$HTML" | grep -o 'href="/commercial"' | wc -l
# expect: >= 3 (desktop nav, mobile menu, bottom tab bar, footer)
echo "$HTML" | grep -o 'Privacy Policy' | head -1        # expect: match (footer)
echo "$HTML" | grep -o 'Call Now' | head -1              # expect: match (sticky button)
echo "$HTML" | grep -o 'href="/#contact"' | head -1      # expect: match (hash mechanism live)
echo "$HTML" | grep -o 'src="/nextlevellogo.png"' | head -1  # expect: match (PUBLIC_URL gone)

curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/images/flakes/coyote.jpg
# expect: 200 image/jpeg
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/images/codelabslogo.png
# expect: 200
pkill -f "next dev" || true
```

Optional manual check (recommended, 1 min): open http://localhost:3000/nonexistent in a browser — dark-showroom 404 with glass header, footer, pulsing Call Now button; clicking "Get a Free Quote" navigates to `/#contact` (the home page itself 404s until Task 9 — the URL changing is the pass signal for now; full scroll behavior is verified in Task 9's checks).

- [ ] **Step 11: Commit**

```bash
git add src/Header.jsx src/Footer.jsx src/StickyCallButton.jsx \
  src/components/SwatchModal.jsx src/FlakeCarousel.jsx src/components/LegalLayout.jsx \
  src/Hero.jsx src/Gallery.jsx src/Testimonials.jsx src/Warranty.jsx \
  src/EpoxyInfo.jsx src/ContactForm.jsx src/accents/PourDivider.jsx \
  src/accents/ResinSwirl.jsx src/accents/FlakeField.jsx src/accents/GlossSweep.jsx \
  src/accents/GrindRing.jsx src/accents/ConcreteTexture.jsx src/accents/icons.jsx \
  src/PublicChrome.jsx
git commit -m "$(cat <<'EOF'
feat(next): port shared chrome off react-router; /#contact hash mechanism

Header/Footer/StickyCallButton/SwatchModal/FlakeCarousel/LegalLayout on
next/link + next/navigation; router-state contact scroll replaced by native
/#contact hash (smooth-scroll CSS already global); FlakeCarousel + footer
logos moved to /public string paths; 'use client' on all shared home-section
and accent components. PublicChrome now renders the full marketing chrome.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

**Hand-off state after Chunk 2:** `next dev` boots; root + `(public)` layouts, registry, GA4 loader, base metadata/JSON-LD, and the branded 404 all render server-side with full chrome; every shared component compiles under Next. No `app/(public)/*/page.js` exists yet — Chunk 3 adds the 16 public routes on top of this scaffold, using `src/seo.js` (Task 9) to re-state the site-wide OG fields per the shallow-merge rule above.

## Chunk 3: Public pages

Prerequisites: Tasks 6–8 are complete — `next@^16.2.10` is installed, `app/layout.js` (fonts, base metadata, `BUSINESS_GRAPH` JSON-LD, GtagLoader) and `app/(public)/layout.js` (Header/Footer/StickyCallButton chrome) exist, and the shared components (Header, Footer, StickyCallButton, SwatchModal, FlakeCarousel, LegalLayout, useScrollReveal consumers) are ported with `'use client'`. Repo facts you need for this chunk: the dev server is `npm run dev:next` on http://localhost:3000 (the Express API on :4242 is NOT needed for any verification below — these pages only render); every page component lives flat in `src/` and is imported from `app/` via relative paths; the site host is always `https://www.nextlevelepoxynm.com`; phone is 505-352-4674.

**Dev-server pattern used by every verification step in this chunk** (start once per task, kill when the task's checks pass): run `npm run dev:next > /tmp/next-dev.log 2>&1 &` then `sleep 8` (first compile of a route can take a few seconds), run the curl checks, then `kill %1` (or `pkill -f "next dev" || true`).

**Metadata gotcha this chunk is built around:** Next.js metadata merging is SHALLOW. If a page exports `openGraph` (or `twitter`), that object REPLACES the root layout's — nested fields are NOT deep-merged. Today every prerendered page carries the site-wide `og:image/og:type/og:locale/og:site_name` tags from `public/index.html`, so every page that sets any og field must re-state the site-wide og fields or they silently vanish (and the Task 18 parity compare fails). The `src/seo.js` helper created in Task 9 does this once; all page metadata in Tasks 9–13 goes through it. Pages that do NOT export `twitter` inherit the root layout's twitter card/image untouched — only Home sets `twitter`.

### Task 9: Home page (`/`)

- [ ] **Step 1: Ensure every home-section component is a client component.** The home `page.js` is a SERVER file importing these directly, and styled-components cannot execute inside server components — Task 8 Step 9 already put `'use client'` on all of them. Verify nothing is missing:

  ```bash
  for f in src/Hero.jsx src/EpoxyInfo.jsx src/Warranty.jsx src/Gallery.jsx src/Testimonials.jsx \
           src/ContactForm.jsx src/FlakeCarousel.jsx src/accents/PourDivider.jsx src/accents/ResinSwirl.jsx \
           src/accents/ConcreteTexture.jsx src/accents/GlossSweep.jsx src/accents/GrindRing.jsx src/accents/FlakeField.jsx; do
    head -1 "$f" | grep -q "use client" || echo "$f"
  done
  ```

  Expected output: EMPTY. If any file prints, insert `'use client';` + a blank line above its line 1 (the exact edit pattern is shown for Commercial in Task 10 Step 1) and nothing else — in particular Hero's guarded `useState(() => typeof window !== 'undefined' && …)` initializer and its single universal poster `/videos/posters/hero.jpg` are documented LCP decisions that stay exactly as they are.

- [ ] **Step 2: Create `src/seo.js`** (shared metadata builder — complete file):

  ```js
  // Shared per-page metadata builder for the public pages under app/(public)/.
  //
  // WHY every page re-states the site-wide OG fields: Next.js metadata merging
  // is SHALLOW — a page-level `openGraph` export REPLACES the root layout's
  // `openGraph` entirely (nested fields are not deep-merged). Today every
  // prerendered page carries the site-wide og:image/type/locale/site_name tags
  // from public/index.html, so OG_DEFAULTS is spread into every page's
  // openGraph to keep the rendered tags byte-identical (SEO parity gate,
  // Tasks 5/18). Pages that do NOT export `twitter` still inherit the root
  // layout's twitter card/image unchanged — only the home page sets twitter.
  export const SITE = 'https://www.nextlevelepoxynm.com';

  export const OG_DEFAULTS = {
    siteName: 'Next Level Epoxy Flooring',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${SITE}/images/og-image.jpg`,
        type: 'image/jpeg',
        width: 1200,
        height: 630,
        alt: 'Next Level Epoxy Flooring — lifetime-warranty epoxy floors in Albuquerque, Santa Fe & Rio Rancho, NM',
      },
    ],
  };

  export function pageMetadata({ title, description, path, ogTitle, ogDescription }) {
    const url = `${SITE}${path}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        ...OG_DEFAULTS,
        title: ogTitle || title,
        description: ogDescription || description,
        url,
      },
    };
  }
  ```

- [ ] **Step 3: Create `app/(public)/page.js`** (complete file — meta strings are byte-for-byte from the old inline Helmet in `src/App.js:95-108`; section order is byte-for-byte from `src/App.js:109-131`):

  ```jsx
  import Hero from '../../src/Hero';
  import EpoxyInfo from '../../src/EpoxyInfo';
  import Warranty from '../../src/Warranty';
  import FlakeCarousel from '../../src/FlakeCarousel';
  import Gallery from '../../src/Gallery';
  import Testimonials from '../../src/Testimonials';
  import ContactForm from '../../src/ContactForm';
  import { PourDivider, ResinSwirl } from '../../src/accents';
  import { pageMetadata } from '../../src/seo';

  export const metadata = {
    ...pageMetadata({
      title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy',
      description: 'Epoxy flooring in Albuquerque, Santa Fe & Rio Rancho NM. Lifetime garage floors & concrete coatings. 560+ installed. Free quote: 505-352-4674.',
      ogDescription: 'Lifetime-warranty epoxy garage floors & concrete coatings in Albuquerque, Santa Fe & Rio Rancho NM. 560+ floors installed. Free quote: 505-352-4674.',
      path: '/',
    }),
    // Home is the ONLY page with its own twitter:title/description (see
    // helmet-meta extraction). `twitter` is shallow-replaced, so the
    // site-wide card + image must be re-stated here.
    twitter: {
      card: 'summary_large_image',
      title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level',
      description: 'Lifetime-warranty epoxy garage floors & concrete coatings across New Mexico. 560+ floors installed. Free quote: 505-352-4674.',
      images: ['https://www.nextlevelepoxynm.com/images/twitter-image.jpg'],
    },
  };

  export default function HomePage() {
    return (
      <>
        <Hero />
        <PourDivider style={{ background: 'var(--bg0)' }} />
        <EpoxyInfo />
        <Warranty />
        <ResinSwirl style={{ background: 'var(--bg0)' }} />
        <FlakeCarousel />
        <Gallery />
        <Testimonials />
        <ContactForm />
      </>
    );
  }
  ```

- [ ] **Step 4: Verify** (dev-server pattern from the chunk intro):

  ```bash
  curl -s http://localhost:3000/ | grep -o '<title>[^<]*</title>'
  ```
  Expected (note the HTML-escaped `&amp;` — the parity extractor from Task 5 decodes entities):
  ```
  <title>Epoxy Flooring Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level Epoxy</title>
  ```
  ```bash
  curl -s http://localhost:3000/ | grep -c 'name="twitter:title"'          # expect: 1
  curl -s http://localhost:3000/ | grep -c 'twitter-image.jpg'             # expect: 1
  curl -s http://localhost:3000/ | grep -c 'rel="canonical"'               # expect: 1
  curl -s http://localhost:3000/ | grep -c 'id="contact"'                  # expect: 1  (ContactForm.jsx:375 — the /#contact anchor target from Task 8)
  curl -s http://localhost:3000/ | grep -c 'property="og:image"'           # expect: 1
  ```
  Also eyeball `/tmp/next-dev.log` for styled-components/hydration errors (there should be none). Kill the dev server.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/seo.js "app/(public)/page.js"
  git commit -m "feat(next): home page port — server metadata via src/seo.js + client sections

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```
  (If Step 1 had to add `'use client'` anywhere, include those files in the `git add`.)

### Task 10: Simple pages (commercial, radon, careers, privacy, terms, polished-concrete, thank-you, snake)

Pattern for every page here: (a) component edit — add `'use client'` (styled-components + hooks require it), delete the react-helmet import and `<Helmet>` block, port `Link` where present; (b) new thin server `app/(public)/<route>/page.js` exporting `metadata` and rendering the component. All meta strings below are byte-for-byte from the current Helmet blocks.

- [ ] **Step 1: Port `src/Commercial.jsx`.** Two edits. Note: Commercial is a useScrollReveal consumer — if Task 8 already put `'use client'` on line 1, skip that part.

  Lines 1–3, before:
  ```jsx
  import React, { useEffect, useRef, useState } from 'react';
  import styled, { css, keyframes } from 'styled-components';
  import { Helmet } from 'react-helmet';
  ```
  After:
  ```jsx
  'use client';

  import React, { useEffect, useRef, useState } from 'react';
  import styled, { css, keyframes } from 'styled-components';
  ```

  Lines 901–911 (inside `return (`), before:
  ```jsx
      <>
        <Helmet>
          <title>Commercial Epoxy Flooring Albuquerque & Santa Fe NM | Next Level</title>
          <meta name="description" content="Heavy-duty commercial epoxy & polyaspartic floor coatings for warehouses, restaurants, auto shops, and industrial facilities in NM. Lifetime warranty. 505-352-4674." />
          <link rel="canonical" href="https://www.nextlevelepoxynm.com/commercial" />
          <meta property="og:title" content="Commercial Epoxy Flooring Albuquerque & Santa Fe NM | Next Level" />
          <meta property="og:description" content="Heavy-duty commercial epoxy & polyaspartic floor coatings for warehouses, restaurants, auto shops, and industrial facilities in NM." />
          <meta property="og:url" content="https://www.nextlevelepoxynm.com/commercial" />
        </Helmet>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
  ```
  After:
  ```jsx
      <>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
  ```

- [ ] **Step 2: Create `app/(public)/commercial/page.js`** (complete):

  ```jsx
  import Commercial from '../../../src/Commercial';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = pageMetadata({
    title: 'Commercial Epoxy Flooring Albuquerque & Santa Fe NM | Next Level',
    description: 'Heavy-duty commercial epoxy & polyaspartic floor coatings for warehouses, restaurants, auto shops, and industrial facilities in NM. Lifetime warranty. 505-352-4674.',
    ogDescription: 'Heavy-duty commercial epoxy & polyaspartic floor coatings for warehouses, restaurants, auto shops, and industrial facilities in NM.',
    path: '/commercial',
  });

  export default function CommercialPage() {
    return <Commercial />;
  }
  ```

- [ ] **Step 3: Port `src/Radon.jsx`.** Radon has no hooks, but it creates styled-components, so it still needs the directive. Same shape as Commercial: insert `'use client';` + a blank line above line 1 (`import React from 'react';`), delete line 3 (`import { Helmet } from 'react-helmet';`), and delete the `<Helmet>…</Helmet>` block at lines 99–106 (from `<Helmet>` through `</Helmet>` inside `<RadonContainer>`; the next sibling `<RadonHeading>` stays).

  Create `app/(public)/radon/page.js` (complete):
  ```jsx
  import Radon from '../../../src/Radon';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = pageMetadata({
    title: 'Radon Mitigation & Epoxy Floor Sealing Albuquerque NM | Next Level',
    description: "Protect your home from radon with Next Level's 4-layer epoxy floor sealing system. Serving Albuquerque, Santa Fe & Rio Rancho NM. Free quote: 505-352-4674.",
    ogDescription: 'Seal foundation cracks against radon with our 4-layer epoxy system. Serving Albuquerque & Santa Fe NM.',
    path: '/radon',
  });

  export default function RadonPage() {
    return <Radon />;
  }
  ```

- [ ] **Step 4: Port `src/Careers.jsx`.** Lines 1–3: same pattern as Radon — add `'use client';` + blank line above line 1, delete `import { Helmet } from 'react-helmet';` (line 3). Delete the `<Helmet>…</Helmet>` block at lines 163–170 (next sibling `<CareersHeading>` stays). Careers' form submit (fetch to `/api/leads` + `trackFormSubmission('career')`) is untouched.

  Create `app/(public)/careers/page.js` (complete):
  ```jsx
  import Careers from '../../../src/Careers';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = pageMetadata({
    title: 'Careers at Next Level Epoxy | Hiring Floor Installers in Albuquerque NM',
    description: "Join the Next Level Epoxy team — we're hiring floor installers and crew in Albuquerque & Santa Fe, NM. Apply online for current openings.",
    ogTitle: 'Careers at Next Level Epoxy | Hiring in Albuquerque NM',
    ogDescription: 'Join the Next Level Epoxy team — floor installer and crew roles in Albuquerque & Santa Fe, NM.',
    path: '/careers',
  });

  export default function CareersPage() {
    return <Careers />;
  }
  ```

- [ ] **Step 5: Port `src/Privacy.jsx` and `src/Terms.jsx`** (identical shape; LegalLayout was ported in Task 8). For each file — lines 1–4, before (Privacy shown; Terms is identical):
  ```jsx
  import React from 'react';
  import { Helmet } from 'react-helmet';
  import { Link } from 'react-router-dom';
  import LegalLayout from './components/LegalLayout';
  ```
  After:
  ```jsx
  'use client';

  import React from 'react';
  import Link from 'next/link';
  import LegalLayout from './components/LegalLayout';
  ```
  Delete the `<Helmet>…</Helmet>` block (lines 8–15 in both files; keep the surrounding `<>` fragment and `<LegalLayout …>`). Port the one body link in each: `src/Privacy.jsx:97` `<Link to="/terms">` → `<Link href="/terms">`; `src/Terms.jsx:98` `<Link to="/privacy">` → `<Link href="/privacy">`.

  Create `app/(public)/privacy/page.js` (complete):
  ```jsx
  import Privacy from '../../../src/Privacy';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = pageMetadata({
    title: 'Privacy Policy | Next Level Epoxy Flooring',
    description: 'How Next Level Epoxy Flooring collects, uses, and protects your information when you request a quote or browse nextlevelepoxynm.com.',
    ogDescription: 'How Next Level Epoxy Flooring collects, uses, and protects your information.',
    path: '/privacy',
  });

  export default function PrivacyPage() {
    return <Privacy />;
  }
  ```
  Create `app/(public)/terms/page.js` (complete):
  ```jsx
  import Terms from '../../../src/Terms';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = pageMetadata({
    title: 'Terms of Service | Next Level Epoxy Flooring',
    description: "Terms of service for nextlevelepoxynm.com and Next Level Epoxy Flooring's epoxy and concrete coating services in New Mexico.",
    ogDescription: "Terms of service for nextlevelepoxynm.com and Next Level Epoxy Flooring's New Mexico coating services.",
    path: '/terms',
  });

  export default function TermsPage() {
    return <Terms />;
  }
  ```

- [ ] **Step 6: Port `src/PolishedConcreteDivision.jsx`.** Lines 1–5, before:
  ```jsx
  // src/PolishedConcreteDivision.jsx — bridge page to our sister company, Next Level Polished Concrete
  import React from 'react';
  import styled from 'styled-components';
  import { Helmet } from 'react-helmet';
  import { Link } from 'react-router-dom';
  ```
  After:
  ```jsx
  'use client';

  // src/PolishedConcreteDivision.jsx — bridge page to our sister company, Next Level Polished Concrete
  import React from 'react';
  import styled from 'styled-components';
  import Link from 'next/link';
  ```
  Delete the whole `const SEO = () => ( <Helmet>…</Helmet> );` block (lines 9–23) and the `<SEO />` element at line 105. Port line 122: `<Back to="/">` → `<Back href="/">` (`Back` is `styled(Link)`; next/link accepts `href` through styled-components).

  Create `app/(public)/polished-concrete/page.js` (complete — this page has `keywords`):
  ```jsx
  import PolishedConcreteDivision from '../../../src/PolishedConcreteDivision';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = {
    ...pageMetadata({
      title: 'Polished Concrete Floors — Next Level Polished Concrete (Our Sister Company)',
      description: 'Want polished, dyed, stained, or grind-and-seal concrete instead of an epoxy coating? Our sister company, Next Level Polished Concrete, delivers extremely high-quality polished concrete across Albuquerque, Santa Fe & Rio Rancho NM.',
      ogTitle: 'Polished Concrete Floors — Next Level Polished Concrete',
      ogDescription: 'Our sister company delivers polished, dyed, stained & grind-and-seal concrete across New Mexico.',
      path: '/polished-concrete',
    }),
    keywords: 'polished concrete Albuquerque, dyed concrete Santa Fe, stained concrete Rio Rancho, grind and seal NM, Next Level Polished Concrete',
  };

  export default function PolishedConcretePage() {
    return <PolishedConcreteDivision />;
  }
  ```

- [ ] **Step 7: Port `src/ThankYou.jsx`.** Head edits: insert `'use client';` + a blank line above line 1 (`import React, { useEffect } from 'react';`); line 3 `import { Link } from 'react-router-dom';` → `import Link from 'next/link';`; delete line 4 (`import { Helmet } from 'react-helmet';`). Delete the `<Helmet>…</Helmet>` block at lines 138–141 (`<title>Thanks — Next Level Epoxy</title>` + robots meta — both move to the page metadata). Port lines 151–152: `<PrimaryBtn to="/garagemakeover">` → `<PrimaryBtn href="/garagemakeover">`, `<SecondaryBtn to="/">` → `<SecondaryBtn href="/">` (both are `styled(Link)`). KEEP the `useEffect` gtag `page_view` send to `AW-11478525428` (lines 120–133) — it is the Ads conversion belt-and-suspenders.

  Create `app/(public)/thank-you/page.js` (complete — no canonical/description/og today, and that stays true; `robots` noindex matches the old Helmet):
  ```jsx
  import ThankYou from '../../../src/ThankYou';

  export const metadata = {
    title: 'Thanks — Next Level Epoxy',
    robots: { index: false, follow: true },
  };

  export default function ThankYouPage() {
    return <ThankYou />;
  }
  ```

- [ ] **Step 8: Port `src/Snake.jsx` (SSR breaker — needs the guard + a client-only wrapper).** Add `'use client';` + blank line above line 1. Then fix the unguarded window read at line 132:

  Before:
  ```jsx
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // Check if mobile
  ```
  After:
  ```jsx
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768); // Check if mobile
  ```

  Create `src/SnakeClientOnly.jsx` (complete — `next/dynamic` with `ssr: false` is not allowed directly in server components, hence this client wrapper; Snake also has Math.random state + react-confetti, so skipping SSR entirely is correct):
  ```jsx
  'use client';

  import dynamic from 'next/dynamic';

  // Snake is a browser-only easter egg (window sizing, keydown/resize
  // listeners, Math.random food placement, react-confetti). No SEO value —
  // render client-side only.
  const Snake = dynamic(() => import('./Snake'), { ssr: false });

  export default function SnakeClientOnly() {
    return <Snake />;
  }
  ```
  Create `app/(public)/snake/page.js` (complete — deliberately NO metadata export: today /snake has no Helmet block and inherits only the base tags; under Next it inherits the root layout metadata the same way):
  ```jsx
  import SnakeClientOnly from '../../../src/SnakeClientOnly';

  export default function SnakePage() {
    return <SnakeClientOnly />;
  }
  ```

- [ ] **Step 9: Verify all 8 routes** (dev-server pattern):

  ```bash
  for p in commercial radon careers privacy terms polished-concrete thank-you snake; do
    printf '%-20s' "/$p"; curl -s "http://localhost:3000/$p" | grep -o '<title>[^<]*</title>'
  done
  ```
  Expected:
  ```
  /commercial         <title>Commercial Epoxy Flooring Albuquerque &amp; Santa Fe NM | Next Level</title>
  /radon              <title>Radon Mitigation &amp; Epoxy Floor Sealing Albuquerque NM | Next Level</title>
  /careers            <title>Careers at Next Level Epoxy | Hiring Floor Installers in Albuquerque NM</title>
  /privacy            <title>Privacy Policy | Next Level Epoxy Flooring</title>
  /terms              <title>Terms of Service | Next Level Epoxy Flooring</title>
  /polished-concrete  <title>Polished Concrete Floors — Next Level Polished Concrete (Our Sister Company)</title>
  /thank-you          <title>Thanks — Next Level Epoxy</title>
  /snake              <title>Epoxy Flooring Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level Epoxy</title>
  ```
  (/snake showing the root-layout base title is CORRECT — that matches today's behavior.) Then:
  ```bash
  curl -s http://localhost:3000/thank-you | grep -o 'name="robots" content="[^"]*"'
  # expect: name="robots" content="noindex, follow"
  #   (Next inserts a space after the comma vs today's "noindex,follow" — the
  #    parity lib from Task 5 normalizes robots whitespace, so this is a non-diff)
  curl -s http://localhost:3000/thank-you | grep -c 'rel="canonical"'   # expect: 0
  curl -s http://localhost:3000/snake     | grep -c 'rel="canonical"'   # expect: 0
  curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/snake  # expect: 200
  grep -i "error" /tmp/next-dev.log | grep -v "404" ; echo "exit=$?"    # expect: exit=1 (no errors)
  ```
  Kill the dev server.

- [ ] **Step 10: Commit.**

  ```bash
  git add src/Commercial.jsx src/Radon.jsx src/Careers.jsx src/Privacy.jsx src/Terms.jsx src/PolishedConcreteDivision.jsx src/ThankYou.jsx src/Snake.jsx src/SnakeClientOnly.jsx "app/(public)/commercial" "app/(public)/radon" "app/(public)/careers" "app/(public)/privacy" "app/(public)/terms" "app/(public)/polished-concrete" "app/(public)/thank-you" "app/(public)/snake"
  git commit -m "feat(next): port 8 simple public pages — helmet removed, server metadata

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 11: /garagemakeover + /patios (page JSON-LD moves to server pages)

- [ ] **Step 1: Edit `src/GarageMakeover.jsx`.** Lines 1–6, before:
  ```jsx
  // src/pages/GarageMakeover.jsx
  import React, { useEffect, useRef, useState } from 'react';
  import styled from 'styled-components';
  import { Helmet } from 'react-helmet';

  import ContactForm from './ContactForm';
  ```
  After:
  ```jsx
  'use client';

  // src/pages/GarageMakeover.jsx
  import React, { useEffect, useRef, useState } from 'react';
  import styled from 'styled-components';

  import ContactForm from './ContactForm';
  ```
  Delete the entire `const SEO = () => ( <Helmet>…</Helmet> );` block, lines 8–54 (from `const SEO = () => (` through the closing `);` — title, description, keywords, canonical, og tags, and the ld+json Service schema all move to the server page in Step 2). Delete the `<SEO />` element at line 534 (inside `<PageContainer>`; `<HeroSection …>` becomes the first child). Everything else — the guarded `isMobile` initializer, video sources, `ContactForm` with `source="garage_makeover_form"` — stays untouched.

- [ ] **Step 2: Create `app/(public)/garagemakeover/page.js`** (complete — schema values copied verbatim from the deleted Helmet block; note this schema's provider is an INLINE LocalBusiness incl. Los Lunas, not an `@id` ref — keep it that way):

  ```jsx
  import GarageMakeover from '../../../src/GarageMakeover';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = {
    ...pageMetadata({
      title: 'Garage Makeover Albuquerque & Santa Fe NM | Next Level Epoxy',
      description: 'Garage makeover in Albuquerque & Santa Fe, NM: epoxy flooring, polyaspartic coatings, lighting, wall paint, baseboards. Lifetime warranty. Free quote.',
      ogTitle: 'Complete Garage Makeover | Epoxy & Polyaspartic Floor Coatings | Albuquerque & Santa Fe NM',
      ogDescription: 'Transform your garage with professional epoxy flooring, polyaspartic coatings, custom lighting & wall finishing. Lifetime warranty. Serving Albuquerque & Santa Fe, NM.',
      path: '/garagemakeover',
    }),
    keywords: 'garage makeover Albuquerque, epoxy garage floor Albuquerque, polyaspartic floor coating Santa Fe, garage floor coating near me, epoxy flooring near me, concrete floor coating New Mexico, garage renovation Albuquerque, metallic epoxy flooring, flake epoxy garage floor, one day garage floor coating, residential epoxy flooring, commercial epoxy flooring, garage transformation, epoxy flooring cost, best garage floor coating',
  };

  // Moved verbatim from the old <SEO> Helmet block in src/GarageMakeover.jsx
  // (only the transport changed: react-helmet → server-rendered script tag).
  const SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Complete Garage Makeover Package',
    description: 'Professional garage makeover including epoxy flooring, polyaspartic floor coatings, wall painting, baseboard installation, and custom lighting in Albuquerque and Santa Fe, New Mexico.',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Next Level Epoxy Flooring',
      url: 'https://www.nextlevelepoxynm.com',
      telephone: '+1-505-352-4674',
      areaServed: [
        { '@type': 'City', name: 'Albuquerque', addressRegion: 'NM' },
        { '@type': 'City', name: 'Santa Fe', addressRegion: 'NM' },
        { '@type': 'City', name: 'Rio Rancho', addressRegion: 'NM' },
        { '@type': 'City', name: 'Los Lunas', addressRegion: 'NM' },
      ],
      priceRange: '$$',
    },
    serviceType: ['Epoxy Flooring', 'Polyaspartic Floor Coating', 'Garage Makeover', 'Concrete Floor Coating', 'Garage Floor Coating'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Garage Makeover Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Epoxy Garage Floor Coating' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Polyaspartic Garage Floor Coating' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Metallic Epoxy Flooring' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Decorative Flake Floor Coating' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Garage Wall Painting & Baseboards' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom Garage Lighting Installation' } },
      ],
    },
  };

  export default function GarageMakeoverPage() {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
        <GarageMakeover />
      </>
    );
  }
  ```

- [ ] **Step 3: Copy the UV+ flake images to public/.** Patios' `require.context('./images/uv-flakes')` (webpack-only, breaks the Next build) is replaced in Step 4; the images must be web-served. `public/images/*` is already gitignored (only the two og cards are tracked), and deploy.sh v2 (Task 21) rsyncs `public/` — same media-ship path as the rest of the site.

  ```bash
  mkdir -p public/images/uv-flakes
  cp -R src/images/uv-flakes/. public/images/uv-flakes/
  ls public/images/uv-flakes | wc -l
  ```
  Expected: `36`

- [ ] **Step 4: Edit `src/Patios.jsx`.** Four edits.

  Lines 1–5, before:
  ```jsx
  // src/Patios.jsx — UV-resistant epoxy patio coatings
  import React, { useEffect, useRef, useState } from 'react';
  import styled from 'styled-components';
  import { Helmet } from 'react-helmet';
  import { Link } from 'react-router-dom';
  ```
  After:
  ```jsx
  'use client';

  // src/Patios.jsx — UV-resistant epoxy patio coatings
  import React, { useEffect, useRef, useState } from 'react';
  import styled from 'styled-components';
  import Link from 'next/link';
  ```

  Delete the `const SEO = () => ( <Helmet>…</Helmet> );` block, lines 11–44 (through its closing `);`) and the `<SEO />` element at line 514. Then replace the webpack directory scan. Lines 46–47 (comment + require.context), before:
  ```jsx
  /* ── UV+ flake catalog (Torginol UV+ line) ─────────────────────────── */
  const uvFlakeContext = require.context('./images/uv-flakes', false, /\.jpg$/);
  ```
  After (STANDARD_NAMES below it stays untouched):
  ```jsx
  /* ── UV+ flake catalog (Torginol UV+ line) ─────────────────────────
     Images serve from /public/images/uv-flakes (copied from src/images/
     uv-flakes). The 36 jpg filenames there are exactly the keys of UV_SKUS
     (verified 2026-07-20), so the list derives from UV_SKUS — no webpack
     require.context, which does not exist under Next. */
  ```
  The `allUvFlakes` builder, before (lines 55–57):
  ```jsx
  const allUvFlakes = uvFlakeContext.keys().map((key) => {
    const filename = key.replace('./', '').replace('.jpg', '');
    const name = filename
  ```
  After:
  ```jsx
  const allUvFlakes = Object.keys(UV_SKUS).map((filename) => {
    const name = filename
  ```
  And the `img:` line inside that map, before:
  ```jsx
      img: uvFlakeContext(key),
  ```
  After:
  ```jsx
      img: `/images/uv-flakes/${filename}.jpg`,
  ```
  Finally port the one Link at line 621: `<Link to="/colors">` → `<Link href="/colors">`.

- [ ] **Step 5: Create `app/(public)/patios/page.js`** (complete — schema verbatim from the deleted Helmet block):

  ```jsx
  import Patios from '../../../src/Patios';
  import { pageMetadata } from '../../../src/seo';

  export const metadata = {
    ...pageMetadata({
      title: 'Epoxy Patio Coatings Albuquerque, Santa Fe & Rio Rancho NM | Next Level',
      description: "UV-resistant epoxy patio coatings in Albuquerque, Santa Fe & Rio Rancho NM. Won't fade in NM sun. Stain-proof, slip-safe, lifetime warranty. Free quote: 505-352-4674.",
      ogDescription: "UV-stable polyaspartic patio coatings that don't fade, stain, or crack in the NM sun. Lifetime warranty. Free quote.",
      path: '/patios',
    }),
    keywords: 'epoxy patio Albuquerque, patio coating Santa Fe, UV resistant patio flooring Rio Rancho, outdoor concrete coating New Mexico, polyaspartic patio floor, patio resurfacing Albuquerque, backyard concrete coating, pool deck epoxy NM, concrete patio refinishing',
  };

  // Moved verbatim from the old <SEO> Helmet block in src/Patios.jsx.
  const SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Epoxy & Polyaspartic Patio Coatings',
    serviceType: ['Patio Coating', 'Outdoor Concrete Coating', 'UV-Resistant Floor Coating'],
    description: "UV-stable polyaspartic patio coatings for outdoor concrete in Albuquerque, Santa Fe, and Rio Rancho, New Mexico. Won't fade, stain, or crack. Lifetime warranty on prepared concrete.",
    provider: {
      '@type': 'LocalBusiness',
      name: 'Next Level Epoxy Flooring',
      url: 'https://www.nextlevelepoxynm.com',
      telephone: '+1-505-352-4674',
      areaServed: [
        { '@type': 'City', name: 'Albuquerque', addressRegion: 'NM' },
        { '@type': 'City', name: 'Santa Fe', addressRegion: 'NM' },
        { '@type': 'City', name: 'Rio Rancho', addressRegion: 'NM' },
      ],
      priceRange: '$$',
    },
  };

  export default function PatiosPage() {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
        <Patios />
      </>
    );
  }
  ```

- [ ] **Step 6: Verify** (dev-server pattern):

  ```bash
  curl -s http://localhost:3000/garagemakeover | grep -o '<title>[^<]*</title>'
  # expect: <title>Garage Makeover Albuquerque &amp; Santa Fe NM | Next Level Epoxy</title>
  curl -s http://localhost:3000/garagemakeover | grep -c 'Complete Garage Makeover Package'   # expect: 1
  curl -s http://localhost:3000/garagemakeover | grep -o 'application/ld+json' | wc -l
  # expect: 2  (root layout's BUSINESS_GRAPH + this page's Service schema)
  curl -s http://localhost:3000/patios | grep -o '<title>[^<]*</title>'
  # expect: <title>Epoxy Patio Coatings Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level</title>
  curl -s http://localhost:3000/patios | grep -c 'UV-Resistant Floor Coating'                 # expect: 1
  curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/images/uv-flakes/arbor.jpg   # expect: 200
  curl -s http://localhost:3000/patios | grep -o '/images/uv-flakes/' | wc -l                  # expect: 36 or more (grid img tags)
  ```
  Kill the dev server.

- [ ] **Step 7: Commit.**

  ```bash
  git add src/GarageMakeover.jsx src/Patios.jsx "app/(public)/garagemakeover" "app/(public)/patios"
  git commit -m "feat(next): garagemakeover + patios ports — JSON-LD moved to server pages, uv-flakes off require.context

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 12: Location pages ×3 (shared server SEO builders)

App Router cannot express a partial-dynamic segment (`epoxy-flooring-[city]` would be a literal folder name), so these are three literal folders sharing one client component and one server-side SEO module.

- [ ] **Step 1: Create `src/locationSeo.js`** (complete — templates copied verbatim from `src/LocationPage.jsx:250-279`):

  ```js
  // Server-side SEO builders for the three /epoxy-flooring-* pages.
  // Title/description templates and the @graph schema are verbatim from the
  // old LocationPage.jsx Helmet block — keep strings byte-identical.
  import { pageMetadata, SITE } from './seo';

  export function locationMetadata(city) {
    return pageMetadata({
      title: `Epoxy Flooring ${city.name}, NM | Garage & Concrete Coatings`,
      description: `Lifetime-warranty epoxy floors & coatings in ${city.name}, NM. ${city.lede.short} Free quote: 505-352-4674.`,
      path: `/${city.slug}`,
    });
  }

  // Page-specific JSON-LD: a Service offered in this city, plus a BreadcrumbList.
  // provider references the site-wide LocalBusiness @id rendered by the root
  // layout's BUSINESS_GRAPH (…/#business) — do not inline a second business.
  export function locationSchema(city) {
    const url = `${SITE}/${city.slug}`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          '@id': `${url}#service`,
          serviceType: `Epoxy Flooring in ${city.name}, NM`,
          provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
          areaServed: {
            '@type': 'City',
            name: city.name,
            containedInPlace: { '@type': 'State', name: 'New Mexico' },
          },
          url,
          description: `Epoxy garage floors, polyaspartic coatings, and commercial concrete floor systems for ${city.name}, NM. Lifetime-warranty installs.`,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nextlevelepoxynm.com/' },
            { '@type': 'ListItem', position: 2, name: `${city.name} Epoxy Flooring`, item: url },
          ],
        },
      ],
    };
  }
  ```

- [ ] **Step 2: Edit `src/LocationPage.jsx`.** Lines 1–7, before:
  ```jsx
  import React, { useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import styled from 'styled-components';
  import { Helmet } from 'react-helmet';
  import { FiPhone, FiMapPin, FiCheck, FiArrowRight } from 'react-icons/fi';
  import ContactForm from './ContactForm';
  import { trackPhoneClick } from './lib/analytics';
  ```
  After:
  ```jsx
  'use client';

  import React, { useEffect } from 'react';
  import Link from 'next/link';
  import styled from 'styled-components';
  import { FiPhone, FiMapPin, FiCheck, FiArrowRight } from 'react-icons/fi';
  import ContactForm from './ContactForm';
  import { trackPhoneClick } from './lib/analytics';
  ```
  In the component body (lines 250–292): delete the `url`/`title`/`description` consts (250–252), the whole `const schema = {…};` block (254–279), and the `<Helmet>…</Helmet>` block (283–292) — all now live in `src/locationSeo.js`. KEEP the `useEffect(() => { window.scrollTo(0, 0); }, [city.slug]);` at line 248 (preserves today's scroll-restore behavior when hopping between city pages). Port the two Links: line 297 `<Link to="/">` → `<Link href="/">`; line 378 `<RelatedCard key={r.slug} to={`/${r.slug}`}>` → `<RelatedCard key={r.slug} href={`/${r.slug}`}>` (`RelatedCard` is `styled(Link)`).

- [ ] **Step 3: Create the three page files.** `app/(public)/epoxy-flooring-albuquerque/page.js` (complete):

  ```jsx
  import LocationPage from '../../../src/LocationPage';
  import { ALBUQUERQUE } from '../../../src/locations';
  import { locationMetadata, locationSchema } from '../../../src/locationSeo';

  export const metadata = locationMetadata(ALBUQUERQUE);

  export default function Page() {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(locationSchema(ALBUQUERQUE)) }} />
        <LocationPage city={ALBUQUERQUE} />
      </>
    );
  }
  ```
  `app/(public)/epoxy-flooring-santa-fe/page.js`: identical file with `ALBUQUERQUE` → `SANTA_FE` (all four occurrences). `app/(public)/epoxy-flooring-rio-rancho/page.js`: identical with `ALBUQUERQUE` → `RIO_RANCHO`.

- [ ] **Step 4: Verify** (dev-server pattern):

  ```bash
  for c in albuquerque santa-fe rio-rancho; do
    printf '%-30s' "/epoxy-flooring-$c"; curl -s "http://localhost:3000/epoxy-flooring-$c" | grep -o '<title>[^<]*</title>'
  done
  ```
  Expected:
  ```
  /epoxy-flooring-albuquerque   <title>Epoxy Flooring Albuquerque, NM | Garage &amp; Concrete Coatings</title>
  /epoxy-flooring-santa-fe      <title>Epoxy Flooring Santa Fe, NM | Garage &amp; Concrete Coatings</title>
  /epoxy-flooring-rio-rancho    <title>Epoxy Flooring Rio Rancho, NM | Garage &amp; Concrete Coatings</title>
  ```
  ```bash
  curl -s http://localhost:3000/epoxy-flooring-albuquerque | grep -c 'BreadcrumbList'   # expect: 1
  curl -s http://localhost:3000/epoxy-flooring-albuquerque | grep -o '"@id":"https://www.nextlevelepoxynm.com/#business"' | wc -l    # expect: 2 (BUSINESS_GRAPH node + this page's provider ref)
  curl -s http://localhost:3000/epoxy-flooring-santa-fe | grep -c 'Decorative and durable epoxy for Santa Fe'                # expect: 1 (meta description city middle)
  ```
  Kill the dev server.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/locationSeo.js src/LocationPage.jsx "app/(public)/epoxy-flooring-albuquerque" "app/(public)/epoxy-flooring-santa-fe" "app/(public)/epoxy-flooring-rio-rancho"
  git commit -m "feat(next): location pages x3 — shared server SEO builders, @graph schema server-rendered

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 13: /colors — media copy + flake image manifest (TDD) + AllColors port

`src/AllColors.jsx:15-16` uses webpack-only `require.context` over `src/images/flakes` (flat) and `src/images/torginol` (recursive) — this breaks the Next build outright. Replacement: a committed JSON manifest generated by a script, keyed exactly like today's catalog `file` fields (`flakes/gravel.jpg`, `torginol/garage/bean.jpg`). Missing images drop out of the catalog, same as today's try/catch. NOTE: the images themselves are gitignored but required locally (memory: torginol images gitignored-but-required-locally); the manifest IS committed so builds are deterministic.

- [ ] **Step 1: Copy swatch media to public/** (idempotent even if Task 8 already copied `flakes/` for FlakeCarousel):

  ```bash
  mkdir -p public/images/flakes public/images/torginol
  cp -R src/images/flakes/. public/images/flakes/
  cp -R src/images/torginol/. public/images/torginol/
  find public/images/flakes -name '*.jpg' | wc -l     # expect: 194
  find public/images/torginol -name '*.jpg' | wc -l   # expect: 220
  ```
  (Counts are as of plan time on Bo's laptop — if you've added swatches since, expect your local numbers; the manifest test below is fixture-based and machine-independent.)

- [ ] **Step 2: Write the failing test — `scripts/generate-flake-manifest.test.js`** (complete file; runs under `npm run test:server`, whose glob was widened to `**/{server,scripts}/**/*.test.js` in Task 5):

  ```js
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { buildManifest } = require('./generate-flake-manifest');

  describe('buildManifest', () => {
    let root;

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'flake-manifest-'));
      fs.mkdirSync(path.join(root, 'flakes'));
      fs.mkdirSync(path.join(root, 'torginol', 'garage'), { recursive: true });
      fs.writeFileSync(path.join(root, 'flakes', 'gravel.jpg'), '');
      fs.writeFileSync(path.join(root, 'flakes', 'notes.txt'), '');
      fs.writeFileSync(path.join(root, 'torginol', 'garage', 'bean.jpg'), '');
    });

    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true });
    });

    test('maps flat flakes keys to public paths', () => {
      expect(buildManifest(root)['flakes/gravel.jpg']).toBe('/images/flakes/gravel.jpg');
    });

    test('maps nested torginol keys recursively', () => {
      expect(buildManifest(root)['torginol/garage/bean.jpg']).toBe('/images/torginol/garage/bean.jpg');
    });

    test('ignores non-jpg files', () => {
      expect(Object.keys(buildManifest(root))).toEqual(['flakes/gravel.jpg', 'torginol/garage/bean.jpg']);
    });

    test('missing folders yield an empty manifest', () => {
      expect(buildManifest(path.join(root, 'does-not-exist'))).toEqual({});
    });
  });
  ```

  ```bash
  npm run test:server
  ```
  Expected: FAIL — `Cannot find module './generate-flake-manifest' from 'scripts/generate-flake-manifest.test.js'` (the other suites still pass).

- [ ] **Step 3: Implement `scripts/generate-flake-manifest.js`** (complete file):

  ```js
  #!/usr/bin/env node
  // Generates src/flakeImageManifest.json — the replacement for CRA's
  // webpack `require.context` in src/AllColors.jsx (require.context does not
  // exist under Next). Keys mirror the catalog's `file` fields exactly:
  //   'flakes/<name>.jpg'                → '/images/flakes/<name>.jpg'
  //   'torginol/<collection>/<name>.jpg' → '/images/torginol/<collection>/<name>.jpg'
  // The manifest is COMMITTED (deterministic builds); the jpgs themselves stay
  // gitignored under public/images/. Rerun after adding swatch images:
  //   npm run flakes:manifest
  const fs = require('fs');
  const path = require('path');

  function listJpgs(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        for (const sub of listJpgs(path.join(dir, entry.name))) {
          out.push(path.posix.join(entry.name, sub));
        }
      } else if (/\.jpg$/i.test(entry.name)) {
        out.push(entry.name);
      }
    }
    return out.sort();
  }

  function buildManifest(imagesRoot) {
    const manifest = {};
    for (const folder of ['flakes', 'torginol']) {
      for (const rel of listJpgs(path.join(imagesRoot, folder))) {
        manifest[`${folder}/${rel}`] = `/images/${folder}/${rel}`;
      }
    }
    return manifest;
  }

  if (require.main === module) {
    const root = path.join(__dirname, '..', 'public', 'images');
    const manifest = buildManifest(root);
    const outPath = path.join(__dirname, '..', 'src', 'flakeImageManifest.json');
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`flake manifest: ${Object.keys(manifest).length} images -> ${path.relative(process.cwd(), outPath)}`);
  }

  module.exports = { buildManifest, listJpgs };
  ```

  ```bash
  npm run test:server
  ```
  Expected: PASS — all suites green, including `scripts/generate-flake-manifest.test.js` (4 tests).

- [ ] **Step 4: Add the npm script and generate the manifest.** In `package.json`, after the `"server"` line:

  Before:
  ```json
      "server": "node server/index.js",
  ```
  After:
  ```json
      "server": "node server/index.js",
      "flakes:manifest": "node scripts/generate-flake-manifest.js",
  ```

  ```bash
  npm run flakes:manifest
  # expect: flake manifest: 414 images -> src/flakeImageManifest.json   (194 + 220 at plan time)
  node -e "console.log(Object.keys(require('./src/flakeImageManifest.json')).length)"   # expect: 414
  git check-ignore src/flakeImageManifest.json; echo "exit=$?"                           # expect: exit=1 (NOT ignored — it must be committable)
  ```

- [ ] **Step 5: Port `src/AllColors.jsx`.** Two edits.

  Lines 1–6, before:
  ```jsx
  import React, { useState, useCallback } from 'react';
  import { Link } from 'react-router-dom';
  import styled from 'styled-components';
  import { Helmet } from 'react-helmet';
  import COLLECTIONS from './flakeCatalog';
  import SwatchModal from './components/SwatchModal';
  ```
  After:
  ```jsx
  'use client';

  import React, { useState, useCallback } from 'react';
  import Link from 'next/link';
  import styled from 'styled-components';
  import COLLECTIONS from './flakeCatalog';
  import SwatchModal from './components/SwatchModal';
  import MANIFEST from './flakeImageManifest.json';
  ```

  Lines 14–26 (the require.context block + resolveImg), before:
  ```jsx
  /* ── Image resolution (legacy flat folder + per-collection folders) ─ */
  const flakeCtx = require.context('./images/flakes', false, /\.jpg$/);
  const torginolCtx = require.context('./images/torginol', true, /\.jpg$/);

  const resolveImg = (file) => {
    try {
      if (file.startsWith('flakes/')) return flakeCtx('./' + file.slice('flakes/'.length));
      if (file.startsWith('torginol/')) return torginolCtx('./' + file.slice('torginol/'.length));
    } catch (e) {
      return null;
    }
    return null;
  };
  ```
  After:
  ```jsx
  /* ── Image resolution (committed manifest replaces require.context) ─
     Keys look like 'flakes/gravel.jpg' / 'torginol/garage/bean.jpg'.
     Missing image → null → item dropped, exactly like the old try/catch.
     Regenerate after adding swatches: npm run flakes:manifest */
  const resolveImg = (file) => MANIFEST[file] || null;
  ```

  Then delete the `<Helmet>…</Helmet>` block at lines 283–290 (meta moves to page.js) and port the two links: line 292 `<BackLink to="/">` → `<BackLink href="/">` (`BackLink` is `styled(Link)`), line 335 `<Link to="/patios">` → `<Link href="/patios">`. Everything else (module-scope CATALOG/inStockItems computation, SwatchModal wiring, `#collection` anchor chips) stays as-is — it is all plain JS now that resolveImg is synchronous data.

- [ ] **Step 6: Create `app/(public)/colors/page.js`** (complete — `next/dynamic` WITHOUT `ssr: false` keeps the 517-entry catalog in its own chunk, replacing App.js's `React.lazy` code-split, while still server-rendering the page for SEO):

  ```jsx
  import dynamic from 'next/dynamic';
  import { pageMetadata } from '../../../src/seo';

  // Code-split: the full Torginol catalog (500+ entries + swatch wiring)
  // stays out of the shared bundle — same intent as the old React.lazy split.
  const AllColors = dynamic(() => import('../../../src/AllColors'));

  export const metadata = pageMetadata({
    title: 'Epoxy & Polyaspartic Floor Colors | Custom Flake Systems NM',
    description: 'Browse epoxy and polyaspartic floor color options for garages, basements, and commercial spaces in Albuquerque, Santa Fe, and Rio Rancho NM. Custom flake systems.',
    ogDescription: 'Browse epoxy and polyaspartic floor color options for garages, basements, and commercial spaces in NM.',
    path: '/colors',
  });

  export default function ColorsPage() {
    return <AllColors />;
  }
  ```

- [ ] **Step 7: Verify** (dev-server pattern):

  ```bash
  curl -s http://localhost:3000/colors | grep -o '<title>[^<]*</title>'
  # expect: <title>Epoxy &amp; Polyaspartic Floor Colors | Custom Flake Systems NM</title>
  curl -s http://localhost:3000/colors | grep -o '[0-9]* colors across [0-9]* collections'
  # expect: "<N> colors across 12 collections" — N must MATCH prod exactly:
  curl -s https://www.nextlevelepoxynm.com/colors | grep -o '[0-9]* colors across [0-9]* collections'
  # the two lines above must be identical (mini parity check; Task 18 re-checks H1/JSON-LD)
  curl -s http://localhost:3000/colors | grep -c '/images/torginol/'                          # expect: >0 (grid uses public paths)
  curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/images/flakes/gravel.jpg     # expect: 200
  curl -s http://localhost:3000/colors | grep -o 'nextlevelepoxynm.com/colors' | wc -l        # expect: 2 (canonical + og:url)
  ```
  Kill the dev server.

- [ ] **Step 8: Commit** (manifest included — it is generated-but-committed by design):

  ```bash
  git add scripts/generate-flake-manifest.js scripts/generate-flake-manifest.test.js src/flakeImageManifest.json src/AllColors.jsx package.json "app/(public)/colors"
  git commit -m "feat(next): /colors port — committed flake image manifest replaces require.context

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

**End of Chunk 3.** All 16 public URLs now render from `app/(public)/`. Chunk 4 (Tasks 14–16) adds the admin catch-all, e-sign pages, and the route manifest → sitemap/robots; the full-route `next build` check and parity compare against `docs/seo-baseline.json` happen in Tasks 17–18.

## Chunk 4: Admin, e-sign, sitemap

Context for this chunk: the CRM admin (`/admin/*`, ~19 react-router subroutes, JWT in localStorage) and the customer e-sign flow (`/sign/:token`, `/signed/:token`) render today from the CRA SPA in `src/App.js` — admin behind the `AdminRoute` gate, e-sign bare (no Header/Footer). Neither is prerendered; nginx special-cases `/sign*` past `try_files … =404`. Under Next, admin becomes ONE optional catch-all page mounting the existing react-router tree client-only (react-router-dom stays a dependency — locked decision), and the e-sign pages become real SSR routes (which lets Task 24 drop the nginx special-case). Task 16 then replaces the hand-maintained `public/sitemap.xml` / `public/robots.txt` with generated `app/sitemap.js` / `app/robots.js` driven by a single route manifest — the phase-2 blog extension point.

These tasks build on Chunk 2's scaffold (root `app/layout.js` mounts GlobalStyle + StyledComponentsRegistry + GtagLoader for ALL routes — so admin/e-sign keep the legacy `--primary`/`--bg` CSS vars they consume, and the GA4 loader's own `/sign`/`/admin` gate keeps gtag off these routes). Nothing in this chunk touches production.

### Task 14: Admin SPA under `app/admin/[[...rest]]`

Strategy (locked): NEW `src/admin/AdminApp.jsx` wraps `<BrowserRouter>` around the ENTIRE admin `<Routes>` block copied verbatim from `src/App.js:146-168` (login route + AdminRoute-gated tree + all 19 subroutes; the `/sign` routes are NOT included — they get real Next pages in Task 15). A thin `src/admin/AdminClientOnly.jsx` loads it with `next/dynamic` `ssr: false` (BrowserRouter touches `window`; ssr:false is only legal inside a client component in Next 16). The server page exports `robots: { index: false, follow: false }`. `AdminRoute.jsx`, `AdminLayout.jsx`, `Login.jsx`, `api.js` and all 19 page components keep their react-router internals unchanged — the only edits are two mechanical breakages: CRA's `process.env.PUBLIC_URL` (undefined under Next → `src="undefined/nextlevellogo.png"`) and Login's react-helmet block (all Helmet usages are removed during the port; the dep itself dies in Task 26).

Note: `ssr: false` also guarantees the admin module graph never evaluates server-side — that matters because `DocumentEditor` imports `src/components/PdfPreview.jsx`, whose module-scope `import 'pdfjs-dist/legacy/build/pdf.worker.entry'` crashes outside a browser.

- [ ] **Step 1: Create `src/admin/AdminApp.jsx`** — complete new file:

```jsx
'use client';
// src/admin/AdminApp.jsx
// The entire CRM admin SPA, routes copied verbatim from the CRA src/App.js
// (lines 146-168). react-router-dom keeps running INSIDE Next's
// /admin/[[...rest]] catch-all: Next serves one shell page and BrowserRouter
// owns everything under /admin, so AdminRoute (JWT in localStorage),
// AdminLayout (NavLink/Outlet) and all 19 subroutes work unchanged.
// Mounted client-only via AdminClientOnly.jsx.
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminRoute from './AdminRoute';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import Leads from './Leads';
import LeadDetail from './LeadDetail';
import Quotes from './Quotes';
import QuoteDetail from './QuoteDetail';
import Jobs from './Jobs';
import JobDetail from './JobDetail';
import Schedule from './Schedule';
import Invoices from './Invoices';
import InvoiceDetail from './InvoiceDetail';
import Finances from './Finances';
import Timesheet from './Timesheet';
import ApproveTimesheets from './ApproveTimesheets';
import Inventory from './Inventory';
import Payroll from './Payroll';
import PaySchedule from './PaySchedule';
import Documents from './Documents';
import DocumentEditor from './DocumentEditor';

export default function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/new" element={<QuoteDetail />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="finances" element={<Finances />} />
          <Route path="timesheet" element={<Timesheet />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="pay-schedule" element={<PaySchedule />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id" element={<DocumentEditor />} />
          <Route path="approve" element={<ApproveTimesheets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

(Edge case, unchanged from today's intent: an unknown deep URL like `/admin/nope` matches the Next catch-all but no react-router route, so it renders an empty shell instead of the branded 404. Today it showed NotFound inside PublicLayout. Accepted — admin URLs are hand-typed by two people; do not add routes beyond the verbatim block.)

- [ ] **Step 2: Create `src/admin/AdminClientOnly.jsx`** — complete new file:

```jsx
'use client';
// src/admin/AdminClientOnly.jsx
// Thin client wrapper so the server page can mount AdminApp with ssr:false
// (Next 16 forbids ssr:false directly in server components). Skipping SSR
// keeps browser-only admin deps (BrowserRouter, the pdfjs worker pulled in
// by DocumentEditor → PdfPreview) from ever evaluating on the server.
import dynamic from 'next/dynamic';

const AdminApp = dynamic(() => import('./AdminApp'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1rem',
        color: '#666',
      }}
    >
      Loading CRM…
    </div>
  ),
});

export default function AdminClientOnly() {
  return <AdminApp />;
}
```

- [ ] **Step 3: Create `app/admin/[[...rest]]/page.js`** — complete new file (note the quoted mkdir; `[[…]]` is glob syntax to zsh):

```bash
mkdir -p "app/admin/[[...rest]]"
```

```jsx
// app/admin/[[...rest]]/page.js
// Optional catch-all: /admin, /admin/login, /admin/leads/42, … all serve this
// one shell page; react-router inside AdminApp takes over in the browser.
// The server contributes only noindex metadata + the loading placeholder.
// (nginx's X-Robots-Tag map for /admin stays as belt-and-suspenders.)
import AdminClientOnly from '../../../src/admin/AdminClientOnly';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClientOnly />;
}
```

No `alternates.canonical` and no title — admin inherits the root-layout base title, matching today (only the login screen sets its own title, next step).

- [ ] **Step 4: Edit `src/admin/Login.jsx`** — remove the react-helmet usage and the dead `PUBLIC_URL`. Two exact edits.

Edit 1 — delete the import (current line 4):

```jsx
// BEFORE (src/admin/Login.jsx:4)
import { Helmet } from 'react-helmet';
```

```jsx
// AFTER — line deleted entirely
```

Edit 2 — Helmet block + logo src (current lines 130-140):

```jsx
// BEFORE (src/admin/Login.jsx:130-140)
  return (
    <Wrapper>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin Login</title>
      </Helmet>
      <Card>
        <Logo
          src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}
          alt="NextLevel"
        />
```

```jsx
// AFTER
  return (
    <Wrapper>
      {/* React 19 hoists bare <title> into <head>. The robots noindex meta
          moved to the server metadata export in app/admin/[[...rest]]/page.js
          (covers ALL admin routes) — don't re-add it here (single source of
          truth for overridable tags, per the de-indexing incident rule). */}
      <title>Admin Login</title>
      <Card>
        <Logo
          src="/nextlevellogo.png"
          alt="NextLevel"
        />
```

Everything else in Login.jsx (react-router `useNavigate`, api.post('/login'), role-based redirect) stays byte-identical.

- [ ] **Step 5: Edit `src/admin/AdminLayout.jsx`** — same `PUBLIC_URL` fix (current lines 224-227). Under Next `process.env.PUBLIC_URL` is undefined in client bundles, so the CRA template literal would render a broken `undefined/nextlevellogo.png`:

```jsx
// BEFORE (src/admin/AdminLayout.jsx:224-227)
        <SidebarLogo
          src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}
          alt="NextLevel"
        />
```

```jsx
// AFTER
        <SidebarLogo
          src="/nextlevellogo.png"
          alt="NextLevel"
        />
```

No other edits to AdminLayout.jsx — `NavLink`, `Outlet`, logout, role-based nav all stay react-router.

- [ ] **Step 6: Verify against `next dev`.** In a separate terminal (if not still running from Chunk 3): `npm run dev:next` — wait for `✓ Ready`. Then:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/admin
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/admin/login
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/admin/leads/42
```

Expected: `200` three times (catch-all covers bare `/admin`, one segment, and nested params).

```bash
curl -s http://localhost:3000/admin/login | grep -o '<meta name="robots" content="noindex, nofollow"/>'
curl -s http://localhost:3000/admin/login | grep -c 'Loading CRM'
curl -s http://localhost:3000/admin/login | grep -c '/#contact'
```

Expected: line 1 prints the meta tag exactly; line 2 prints `1` (ssr:false loading placeholder is what the server renders); line 3 prints `0` (no marketing chrome — Header/Footer live only in `app/(public)/layout.js`; grep exits 1 on zero matches, that's the pass condition).

Browser check (dev server still running; the login POST needs the local Express API — run `npm run server` in another terminal, dev-mode `next.config.js` rewrites proxy `/api/*` to :4242): open `http://localhost:3000/admin/login`, assert the browser tab title is **Admin Login** (`document.title` in the console must print `"Admin Login"` — the React-19-hoisted `<title>` from Login.jsx), then log in with the admin credentials, confirm the dashboard renders and the sidebar logo displays. Fallback: if the base site title shows instead (a React-hoisted `<title>` can lose to the metadata-rendered one), remove the JSX `<title>` from Login.jsx and accept the inherited base title — the page is noindexed, this is cosmetic; note whichever happened in this task's commit message. Full CRM click-through is Task 19 (Playwright) and Task 23 (staging).

- [ ] **Step 7: Commit.**

```bash
git add src/admin/AdminApp.jsx src/admin/AdminClientOnly.jsx "app/admin/[[...rest]]/page.js" src/admin/Login.jsx src/admin/AdminLayout.jsx
git commit -m "$(cat <<'EOF'
feat(next/admin): mount CRM SPA under /admin catch-all (client-only react-router)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

### Task 15: e-sign pages — `/sign/[token]` + `/signed/[token]`

These live OUTSIDE the `(public)` route group (no Header/Footer/StickyCallButton — matching today's bare rendering in App.js:142-143). The URL token is the only credential, so both pages export `robots: { index: false, follow: false }` plus `referrer: 'no-referrer'` — the metadata export replaces the old react-helmet `<meta name="referrer">` tag, which is deleted in the ported components. Tokens never leak to GA either: GtagLoader's verbatim `/sign` path gate (Chunk 2) never configs gtag here. Next 16 delivers `params` as a Promise — pages must `await params`.

The originals `src/public/SignDocument.jsx` / `Signed.jsx` stay untouched (still imported by `src/App.js` until Task 26 deletes App.js); the ported copies get new names.

- [ ] **Step 1: Create `src/public/SignDocumentClient.jsx`** — complete new file. It is `SignDocument.jsx` with five mechanical changes: `'use client'` line 1; token via prop (was `useParams`); `useNavigate` → `next/navigation` `useRouter` (`.push`); `PdfPreview` via `next/dynamic` `ssr:false` (its module-scope `pdf.worker.entry` side-effect import crashes server-side; `isEvalSupported: false` inside PdfPreview is untouched and preserved); both `<Helmet>` referrer blocks deleted.

```jsx
'use client';
// src/public/SignDocumentClient.jsx
// Public signer flow: consent → fill fields → submit. No auth, no admin layout.
// Port of SignDocument.jsx for Next: token arrives as a prop from
// app/sign/[token]/page.js; the no-referrer + noindex tags moved to that
// page's metadata export.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import axios from 'axios';
import SignatureModal from '../components/SignatureModal';

// pdfjs-dist wires its web worker via a module-scope side-effect import that
// must never evaluate on the server.
const PdfPreview = dynamic(() => import('../components/PdfPreview'), { ssr: false });

const Page = styled.div`
  min-height: 100vh; background: #f5f8fc;
  display: flex; flex-direction: column;
`;

const Header = styled.div`
  background: white; border-bottom: 1px solid #e2e8f0;
  padding: 14px 22px; display: flex; align-items: center; gap: 12px;
  img { height: 28px; }
  h1 { font-size: 1rem; font-weight: 700; margin: 0; }
  span { color: #6b7280; font-size: .85rem; }
`;

const ConsentCard = styled.div`
  max-width: 540px; margin: 60px auto; background: white; padding: 32px;
  border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,.06);
`;

const Stick = styled.div`
  position: sticky; bottom: 0; background: white; border-top: 1px solid #e2e8f0;
  padding: 12px 22px; display: flex; align-items: center; gap: 14px;
  button {
    margin-left: auto;
    padding: 12px 22px; border-radius: 999px; border: none;
    background: #0f4c81; color: white; font-weight: 700; cursor: pointer;
  }
  button[disabled] { background: #c5d5e8; cursor: not-allowed; }
`;

const FieldBtn = styled.button`
  position: absolute; cursor: pointer; padding: 0;
  background: #fef3c7cc; border: 2px solid #f59e0b;
  font-size: 11px; color: #1f2937; display: flex;
  align-items: center; justify-content: center;
  font-weight: 600; text-transform: uppercase; letter-spacing: .03em;

  &.filled { background: #d1fae5cc; border-color: #10b981; }
`;

const Thumb = styled.img`
  max-width: 90%; max-height: 90%; object-fit: contain;
`;

// SignerPageOverlay — renders absolutely-positioned <FieldBtn>s inside the given page wrap.
const SignerPageOverlay = ({ pageWrap, fields, values, onSignatureClick, onDateClick, onTextClick }) => {
  if (!pageWrap) return null;
  return ReactDOM.createPortal(
    <>
      {fields.map((f) => {
        const v = values[f.id];
        const filled = !!v && (!!(v.value_text && v.value_text.trim()) || !!v.value_image);
        const style = {
          left:   `${Number(f.x) * 100}%`,
          top:    `${Number(f.y) * 100}%`,
          width:  `${Number(f.w) * 100}%`,
          height: `${Number(f.h) * 100}%`,
        };
        const onClick = (e) => {
          e.preventDefault();
          if (f.field_type === 'signature' || f.field_type === 'initials') onSignatureClick(f);
          else if (f.field_type === 'date') onDateClick(f);
          else if (f.field_type === 'text') onTextClick(f);
        };
        return (
          <FieldBtn key={f.id} className={filled ? 'filled' : ''} style={style} onClick={onClick}>
            {filled && v.value_image && <Thumb src={v.value_image} alt="" />}
            {filled && !v.value_image && String(v.value_text || '').slice(0, 40)}
            {!filled && (
              f.field_type === 'signature' ? 'Tap to sign' :
              f.field_type === 'initials' ? 'Initials' :
              f.field_type === 'date'     ? 'Tap for date' :
                                            'Tap to type'
            )}
          </FieldBtn>
        );
      })}
    </>,
    pageWrap
  );
};

const SignDocumentClient = ({ token }) => {
  const router = useRouter();
  const [meta, setMeta] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [consented, setConsented] = useState(false);
  const [pages, setPages] = useState([]);
  const [values, setValues] = useState({}); // { field_id: { value_text, value_image } }
  const [openField, setOpenField] = useState(null);
  const [textPrompt, setTextPrompt] = useState({ open: false, fieldId: null, value: '' });
  const [busy, setBusy] = useState(false);
  const blobRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: m }, { data: ag }, fileResp] = await Promise.all([
          axios.get(`/api/sign/${token}`),
          axios.get(`/api/sign/agreement`),
          axios.get(`/api/sign/${token}/file`, { responseType: 'blob' }),
        ]);
        setMeta(m);
        setAgreement(ag);
        blobRef.current = URL.createObjectURL(fileResp.data);
        setPdfBlob(blobRef.current);
        if (m.status === 'signed') {
          // Already signed — bounce to confirmation
          router.push(`/signed/${token}`);
        }
      } catch (e) {
        if (e?.response?.status === 404) router.push('/');
      }
    })();
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); };
  }, [token, router]);

  const required = useMemo(() => (meta?.fields || []).filter(f => f.required), [meta]);
  const filledCount = required.filter(f => {
    const v = values[f.id];
    return v && ((v.value_text && v.value_text.trim()) || v.value_image);
  }).length;

  const fieldByPage = useMemo(() => {
    const m = new Map();
    for (const f of (meta?.fields || [])) {
      if (!m.has(f.page)) m.set(f.page, []);
      m.get(f.page).push(f);
    }
    return m;
  }, [meta]);

  const giveConsent = async () => {
    setBusy(true);
    try {
      await axios.post(`/api/sign/${token}/consent`, {});
      setConsented(true);
    } catch (e) {
      if (e?.response?.status === 409) setConsented(true); // already recorded
      else alert(e?.response?.data?.error || 'Could not record consent');
    } finally { setBusy(false); }
  };

  const saveValue = async (fieldId, val) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    try {
      await axios.post(`/api/sign/${token}/values`, {
        values: [{ field_id: fieldId, ...val }],
      });
    } catch (e) { console.error('save value', e); }
  };

  const finish = async () => {
    setBusy(true);
    try {
      // For Date fields not yet set, auto-fill with today
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      for (const f of (meta.fields || []).filter(x => x.field_type === 'date' && !values[x.id]?.value_text)) {
        await saveValue(f.id, { value_text: today });
      }
      await axios.post(`/api/sign/${token}/submit`, {});
      router.push(`/signed/${token}`);
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not submit');
    } finally { setBusy(false); }
  };

  if (!meta) return <Page><div style={{ padding: 40 }}>Loading…</div></Page>;

  if (!consented) {
    return (
      <Page>
        <Header>
          <img src="/nextlevellogo.png" alt="Next Level Epoxy" />
          <h1>{meta.title}</h1>
        </Header>
        <ConsentCard>
          <h2 style={{ marginTop: 0 }}>Ready to sign?</h2>
          <p>You're about to sign <strong>{meta.title}</strong>. Before you can fill in any fields, please confirm you agree to use an electronic signature.</p>
          <div style={{ background: '#f7fafc', borderRadius: 8, padding: 16, fontSize: '.92rem', color: '#4a5568', margin: '14px 0' }}>
            {agreement?.text}
          </div>
          <button
            onClick={giveConsent}
            disabled={busy}
            style={{
              width: '100%', padding: 14, background: '#0f4c81',
              color: 'white', border: 'none', borderRadius: 999,
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            }}
          >
            I agree — start signing
          </button>
        </ConsentCard>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <img src="/nextlevellogo.png" alt="Next Level Epoxy" />
        <h1>{meta.title}</h1>
        <span>{filledCount}/{required.length} required fields</span>
      </Header>

      <div style={{ position: 'relative' }}>
        {pdfBlob && <PdfPreview src={pdfBlob} onPagesLoaded={setPages} />}
        {pages.map((p) => (
          <SignerPageOverlay
            key={p.num}
            pageWrap={p.wrap}
            fields={fieldByPage.get(p.num) || []}
            values={values}
            onSignatureClick={(f) => setOpenField({ kind: 'signature', field: f })}
            onDateClick={async (f) => {
              const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              await saveValue(f.id, { value_text: today });
            }}
            onTextClick={(f) => setTextPrompt({ open: true, fieldId: f.id, value: values[f.id]?.value_text || '' })}
          />
        ))}
      </div>

      <Stick>
        <div>{filledCount} of {required.length} required fields complete</div>
        <button onClick={finish} disabled={busy || filledCount < required.length}>Finish &amp; Sign</button>
      </Stick>

      {openField && (
        <SignatureModal
          onClose={() => setOpenField(null)}
          onAdopt={async (val) => {
            await saveValue(openField.field.id, val);
            setOpenField(null);
          }}
        />
      )}

      {textPrompt.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 10, width: 'min(420px, 92vw)' }}>
            <input
              autoFocus
              value={textPrompt.value}
              onChange={(e) => setTextPrompt({ ...textPrompt, value: e.target.value })}
              style={{ width: '100%', padding: 12, fontSize: '1rem', boxSizing: 'border-box' }}
              placeholder="Type here…"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setTextPrompt({ open: false, fieldId: null, value: '' })}>Cancel</button>
              <button onClick={async () => {
                await saveValue(textPrompt.fieldId, { value_text: textPrompt.value });
                setTextPrompt({ open: false, fieldId: null, value: '' });
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default SignDocumentClient;
```

- [ ] **Step 2: Create `src/public/SignedClient.jsx`** — complete new file (port of `Signed.jsx`: token prop instead of `useParams`, Helmet block deleted, no router hooks needed):

```jsx
'use client';
// src/public/SignedClient.jsx — confirmation page after signing.
// Port of Signed.jsx: token arrives as a prop from app/signed/[token]/page.js;
// the no-referrer tag moved to that page's metadata export.
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiDownload } from 'react-icons/fi';
import axios from 'axios';

const Page = styled.div`
  min-height: 100vh; background: #f5f8fc;
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;

const Card = styled.div`
  background: white; padding: 40px; border-radius: 16px; max-width: 480px;
  box-shadow: 0 4px 24px rgba(0,0,0,.06); text-align: center;
`;

const DLBtn = styled.a`
  display: inline-flex; align-items: center; gap: 8px;
  background: #0f4c81; color: white; padding: 12px 22px; border-radius: 999px;
  font-weight: 700; text-decoration: none;
`;

const SignedClient = ({ token }) => {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    axios.get(`/api/sign/${token}`).then(r => setMeta(r.data)).catch(() => {});
  }, [token]);

  return (
    <Page>
      <Card>
        <FiCheckCircle size={56} color="#10b981" />
        <h1 style={{ margin: '14px 0 6px' }}>You're done!</h1>
        <p style={{ color: '#4a5568' }}>
          You signed <strong>{meta?.title || 'the document'}</strong>. A copy is at the link below.
        </p>
        <DLBtn href={`/api/sign/${token}/signed-file`} target="_blank" rel="noopener noreferrer">
          <FiDownload /> Download signed PDF
        </DLBtn>
      </Card>
    </Page>
  );
};

export default SignedClient;
```

- [ ] **Step 3: Create the two server pages.**

```bash
mkdir -p "app/sign/[token]" "app/signed/[token]"
```

`app/sign/[token]/page.js` — complete new file:

```jsx
// app/sign/[token]/page.js
// Customer e-sign flow — OUTSIDE the (public) group: no marketing chrome,
// matching the bare rendering the CRA app gave /sign/:token. The URL token is
// the credential, so: noindex + never send a Referer header (referrer
// metadata replaces the old react-helmet tag). nginx's /sign SPA-fallback
// special-case becomes obsolete at cutover (dropped in Task 24).
import SignDocumentClient from '../../../src/public/SignDocumentClient';

export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function SignPage({ params }) {
  const { token } = await params; // Next 16: params is async
  return <SignDocumentClient token={token} />;
}
```

`app/signed/[token]/page.js` — complete new file:

```jsx
// app/signed/[token]/page.js — post-signature confirmation, same rules as /sign.
import SignedClient from '../../../src/public/SignedClient';

export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function SignedPage({ params }) {
  const { token } = await params;
  return <SignedClient token={token} />;
}
```

- [ ] **Step 4: Verify against `next dev`** (server still running; no Express needed — the token API calls happen only in the browser, curl sees SSR HTML only):

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/sign/dummy-token-check
curl -s http://localhost:3000/sign/dummy-token-check | grep -o '<meta name="robots" content="noindex, nofollow"/>'
curl -s http://localhost:3000/sign/dummy-token-check | grep -o '<meta name="referrer" content="no-referrer"/>'
curl -s http://localhost:3000/sign/dummy-token-check | grep -c 'Loading'
curl -s http://localhost:3000/signed/dummy-token-check | grep -c 'Download signed PDF'
curl -s http://localhost:3000/sign/dummy-token-check | grep -c '/#contact'
```

Expected: `200`; the robots meta tag; the referrer meta tag; `1` (the pre-fetch `Loading…` state is the SSR output); `1` (Signed card SSRs fully); `0` (no Header/Footer — grep exits 1, that's the pass).

End-to-end signing (real token → consent → sign → submit → /signed) is exercised in Task 19/23 with Express running.

- [ ] **Step 5: Commit.**

```bash
git add src/public/SignDocumentClient.jsx src/public/SignedClient.jsx "app/sign/[token]/page.js" "app/signed/[token]/page.js"
git commit -m "$(cat <<'EOF'
feat(next/esign): SSR sign/[token] + signed/[token] pages, noindex + no-referrer via metadata

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

### Task 16: Route manifest → generated sitemap.xml + robots.txt (TDD)

Today `public/sitemap.xml` (13 hand-maintained URLs) and `public/robots.txt` are static files nginx serves from the build. Under Next they become generated routes driven by ONE manifest — `src/routesManifest.js` — which is also the phase-2 blog's extension point. The generated URL set + lastmod values must reproduce the current sitemap EXACTLY (byte-level lastmod strings; Google already has these). `/snake` and `/thank-you` are in the manifest but flagged `sitemap: false` (deliberately excluded today; `/thank-you` is noindex and must stay out). The static files are deleted in this same task — a `public/` file that collides with an app metadata route is a build error, and two sources of truth is exactly the failure mode the de-indexing incident taught us to avoid. (The old file also carried per-URL `<priority>`/`<changefreq>` — deliberately dropped, not forgotten: Google documents that it ignores both and reads only `<lastmod>`, so the manifest stays URL + lastmod only.)

The manifest is CommonJS on purpose: `app/sitemap.js` imports it through Next's compiler (CJS interop is fine), while the jest test `require()`s it directly — plain jest v27 has no babel transform for ESM (that lands in Task 20). The test lives in `scripts/` so Task 5's `test:server` pattern (`**/{server,scripts}/**/*.test.js`) picks it up.

- [ ] **Step 1: Write the failing test first** — `scripts/routes-manifest.test.js`, complete new file:

```js
// scripts/routes-manifest.test.js
// Guards the manifest → sitemap mapping. The 13 EXPECTED entries are a
// byte-for-byte copy of the retired hand-maintained public/sitemap.xml
// (loc + lastmod, same order). If you add a public route, add it to
// src/routesManifest.js AND extend this list deliberately.
const { routes, sitemapEntries } = require('../src/routesManifest');

const EXPECTED = [
  ['https://www.nextlevelepoxynm.com/', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/epoxy-flooring-albuquerque', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/epoxy-flooring-santa-fe', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/epoxy-flooring-rio-rancho', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/commercial', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/garagemakeover', '2026-05-14'],
  ['https://www.nextlevelepoxynm.com/patios', '2026-05-14'],
  ['https://www.nextlevelepoxynm.com/colors', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/radon', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/polished-concrete', '2026-05-16'],
  ['https://www.nextlevelepoxynm.com/careers', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/privacy', '2026-06-11'],
  ['https://www.nextlevelepoxynm.com/terms', '2026-06-11'],
];

describe('routesManifest', () => {
  test('sitemap entries reproduce the 13 legacy sitemap URLs in order, exact lastmod', () => {
    expect(sitemapEntries().map((e) => [e.url, e.lastModified])).toEqual(EXPECTED);
  });

  test('/snake and /thank-you are in the manifest but excluded from the sitemap', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('/snake');
    expect(paths).toContain('/thank-you');
    const urls = sitemapEntries().map((e) => e.url);
    expect(urls).not.toContain('https://www.nextlevelepoxynm.com/snake');
    expect(urls).not.toContain('https://www.nextlevelepoxynm.com/thank-you');
  });

  test('no duplicate paths; every sitemap:true entry has a YYYY-MM-DD lastmod', () => {
    const paths = routes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const r of routes.filter((x) => x.sitemap)) {
      expect(r.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('all sitemap URLs are absolute on the www-canonical host', () => {
    for (const e of sitemapEntries()) {
      expect(e.url).toMatch(/^https:\/\/www\.nextlevelepoxynm\.com\//);
    }
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (module doesn't exist yet):

```bash
npm run test:server
```

Expected output includes:

```
FAIL scripts/routes-manifest.test.js
  ● Test suite failed to run
    Cannot find module '../src/routesManifest' from 'scripts/routes-manifest.test.js'
```

(the existing `server/config/payPeriods.test.js`, `server/util/documentStorage.test.js`, and `scripts/seo-parity.test.js` suites from Task 5 stay green).

- [ ] **Step 3: Create `src/routesManifest.js`** — complete new file:

```js
// src/routesManifest.js
// SINGLE SOURCE OF TRUTH for the public route set + sitemap membership.
// CommonJS on purpose: imported by app/sitemap.js (Next handles CJS interop)
// AND require()'d by plain jest (scripts/routes-manifest.test.js) with no
// babel transform.
//
// sitemap:true entries reproduce EXACTLY the 13 URLs + lastmod values of the
// hand-maintained public/sitemap.xml this module replaced (2026-07 CRA→Next
// migration). Bump a route's lastmod when its content meaningfully changes.
//
// PHASE-2 EXTENSION POINT: the automated weekly SEO blog appends its
// /blog/<slug> entries here ({ path, sitemap: true, lastmod: publish date })
// — app/sitemap.js picks them up with no further wiring.

const SITE = 'https://www.nextlevelepoxynm.com';

const routes = [
  { path: '/', sitemap: true, lastmod: '2026-05-13' },
  { path: '/epoxy-flooring-albuquerque', sitemap: true, lastmod: '2026-05-13' },
  { path: '/epoxy-flooring-santa-fe', sitemap: true, lastmod: '2026-05-13' },
  { path: '/epoxy-flooring-rio-rancho', sitemap: true, lastmod: '2026-05-13' },
  { path: '/commercial', sitemap: true, lastmod: '2026-05-13' },
  { path: '/garagemakeover', sitemap: true, lastmod: '2026-05-14' },
  { path: '/patios', sitemap: true, lastmod: '2026-05-14' },
  { path: '/colors', sitemap: true, lastmod: '2026-05-13' },
  { path: '/radon', sitemap: true, lastmod: '2026-05-13' },
  { path: '/polished-concrete', sitemap: true, lastmod: '2026-05-16' },
  { path: '/careers', sitemap: true, lastmod: '2026-05-13' },
  { path: '/privacy', sitemap: true, lastmod: '2026-06-11' },
  { path: '/terms', sitemap: true, lastmod: '2026-06-11' },
  // Public but deliberately NOT in the sitemap (matches the old static file):
  { path: '/snake', sitemap: false },      // easter egg, no meta of its own
  { path: '/thank-you', sitemap: false },  // noindex conversion page — keep out
];

// → [{ url, lastModified }] in Next's MetadataRoute.Sitemap shape.
// lastModified stays a plain 'YYYY-MM-DD' string so the rendered <lastmod>
// matches the retired sitemap byte-for-byte (a Date would serialize as a
// full ISO timestamp).
function sitemapEntries() {
  return routes
    .filter((r) => r.sitemap)
    .map((r) => ({ url: `${SITE}${r.path}`, lastModified: r.lastmod }));
}

module.exports = { SITE, routes, sitemapEntries };
```

- [ ] **Step 4: Run the test — expect PASS:**

```bash
npm run test:server
```

Expected output includes:

```
PASS scripts/routes-manifest.test.js
```

with `Tests: … passed` and exit code 0 (all four suites green).

- [ ] **Step 5: Create `app/sitemap.js` and `app/robots.js`** — complete new files.

`app/sitemap.js`:

```js
// app/sitemap.js — serves /sitemap.xml, generated from src/routesManifest.js.
// Replaces the hand-maintained public/sitemap.xml (deleted in this commit).
import manifest from '../src/routesManifest';

export default function sitemap() {
  return manifest.sitemapEntries();
}
```

`app/robots.js`:

```js
// app/robots.js — serves /robots.txt, replacing the static public/robots.txt
// (deleted in this commit). Semantics identical: allow everything, keep
// crawlers out of the admin SPA, point at the generated sitemap.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin/login'],
      },
    ],
    sitemap: 'https://www.nextlevelepoxynm.com/sitemap.xml',
  };
}
```

- [ ] **Step 6: Delete the static files** (they would collide with the metadata routes at build time):

```bash
git rm public/sitemap.xml public/robots.txt
```

Expected: `rm 'public/robots.txt'` / `rm 'public/sitemap.xml'`.

- [ ] **Step 7: Verify against `next dev`** (restart `npm run dev:next` if it was running when the public/ files were removed):

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c '<loc>'
curl -s http://localhost:3000/sitemap.xml | tr -d '\n' | grep -o '<loc>https://www.nextlevelepoxynm.com/</loc><lastmod>2026-05-13</lastmod>'
curl -s http://localhost:3000/sitemap.xml | grep -c -e 'snake' -e 'thank-you'
curl -s http://localhost:3000/robots.txt
```

Expected: `13`; the home `<loc>…</loc><lastmod>2026-05-13</lastmod>` pair printed; `0` (grep exits 1 — pass); and robots.txt body:

```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /admin/login

Sitemap: https://www.nextlevelepoxynm.com/sitemap.xml
```

Two accepted cosmetic diffs vs the retired static files (robots directives are case-insensitive per the robots spec; sitemap consumers ignore XML formatting): Next emits `User-Agent` (old file: `User-agent`) and its own XML pretty-printing/namespace attributes on `<urlset>`. Neither affects crawling; if the Task 18 parity compare flags them, allowlist there — do not fight Next's serializer.

- [ ] **Step 8: Commit.**

```bash
git add scripts/routes-manifest.test.js src/routesManifest.js app/sitemap.js app/robots.js
git commit -m "$(cat <<'EOF'
feat(next/seo): route manifest drives generated sitemap.xml + robots.txt

Replaces hand-maintained public/sitemap.xml + robots.txt; 13 URLs and
lastmod values reproduced exactly (jest-guarded). Manifest is the phase-2
blog extension point.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

(The `git rm` from Step 6 is already staged, so this commit both adds the generators and deletes the static files atomically.)

**Chunk 4 exit state:** every URL the site serves today now has a Next-side owner — public pages (Chunk 3), admin catch-all, e-sign token routes, sitemap/robots — and the working tree is ready for Chunk 5's full `next build` + parity gate. No production system has been touched.

## Chunk 5: Full verification

**Context for the executor.** At this point (end of Chunk 4) every route has been ported: all 15 public pages live under `app/(public)/`, admin is a client-only catch-all at `app/admin/[[...rest]]/page.js`, e-sign lives at `app/sign/[token]` + `app/signed/[token]`, and `app/sitemap.js` / `app/robots.js` replaced the static files. This chunk proves — entirely on the laptop, on branch `nextjs-migration` — that the Next.js app is a byte-comparable drop-in for the live CRA site, before Chunk 6 touches EC2. Nothing in this chunk touches production, so there are no HUMAN CHECKPOINTs here.

Repo facts you need: SEO today is carried by a puppeteer prerender of a hardcoded 16-route allow-list (`scripts/prerender.js`, still present until Task 26); the parity harness (`scripts/seo-parity.js`, built in Task 5) snapshotted the live site into `docs/seo-baseline.json` and is the cutover gate; `npm run test:server` was re-pointed in Task 5 to `jest --rootDir=. --testMatch "**/{server,scripts}/**/*.test.js" --watchAll=false` and jest 27.5.1 became an explicit devDependency in Task 4.

---

### Task 17: `next build` full-route render check

Under CRA, "did every route actually get prerendered?" was answered by puppeteer + an allow-list comment. Under Next, `next build` itself fails loudly if any page throws during static generation — but nothing yet asserts that every expected route is *present* in the build output (a deleted `page.js` or a typo'd folder name would silently drop a URL). This task adds a permanent post-build guard that checks `.next/prerender-manifest.json` against the expected route set — the successor to `scripts/prerender.js`'s ROUTES invariant.

- [ ] **Step 1: Pre-flight — confirm the gitignored media is present locally**

The build statically renders every page, and pages reference media that is deliberately NOT in git (`public/images/*`, `public/videos/` are gitignored; flake/torginol images were copied from `src/images/` in Task 13). Verify:

```bash
cd /Users/boshao/projects/nextlevel
ls public/videos/hero-desktop.mp4 public/videos/posters/hero.jpg > /dev/null && echo "videos OK"
ls public/images/flakes/*.jpg | wc -l
find public/images/torginol -name '*.jpg' | wc -l
ls public/images/og-image.jpg public/images/twitter-image.jpg > /dev/null && echo "og cards OK"
```

Expected output:

```
videos OK
     194
     220
og cards OK
```

If the flakes/torginol counts are 0, re-run the Task 13 copy step (`mkdir -p public/images/flakes public/images/torginol && cp -R src/images/flakes/. public/images/flakes/ && cp -R src/images/torginol/. public/images/torginol/` — trailing-dot form, idempotent: avoids nesting `flakes/flakes` when the destinations already exist) and regenerate the manifest (`npm run flakes:manifest`).

- [ ] **Step 2: Write the failing test for the route guard**

Create `scripts/check-build-routes.test.js` (complete file):

```js
/**
 * Tests for the post-build route guard (scripts/check-build-routes.js).
 * Runs under plain jest via the {server,scripts} testMatch glob.
 */
const { missingRoutes, EXPECTED_STATIC } = require('./check-build-routes');

describe('missingRoutes', () => {
  test('returns [] when every expected route is in the manifest', () => {
    const manifestRoutes = { '/': {}, '/commercial': {}, '/sitemap.xml': {} };
    expect(missingRoutes(['/', '/commercial', '/sitemap.xml'], manifestRoutes)).toEqual([]);
  });

  test('reports routes absent from the manifest, in expected order', () => {
    const manifestRoutes = { '/': {} };
    expect(missingRoutes(['/', '/patios', '/colors'], manifestRoutes)).toEqual([
      '/patios',
      '/colors',
    ]);
  });

  test('tolerates an undefined/empty routes object', () => {
    expect(missingRoutes(['/'], undefined)).toEqual(['/']);
    expect(missingRoutes(['/'], {})).toEqual(['/']);
  });
});

describe('EXPECTED_STATIC', () => {
  test('covers the 15 public pages plus sitemap.xml and robots.txt', () => {
    expect(EXPECTED_STATIC).toHaveLength(17);
    expect(EXPECTED_STATIC).toEqual(
      expect.arrayContaining([
        '/',
        '/commercial',
        '/garagemakeover',
        '/patios',
        '/colors',
        '/polished-concrete',
        '/careers',
        '/radon',
        '/thank-you',
        '/snake',
        '/privacy',
        '/terms',
        '/epoxy-flooring-albuquerque',
        '/epoxy-flooring-santa-fe',
        '/epoxy-flooring-rio-rancho',
        '/sitemap.xml',
        '/robots.txt',
      ])
    );
  });

  test('deliberately excludes /404 (literal URL now returns real HTTP 404) and dynamic routes', () => {
    expect(EXPECTED_STATIC).not.toContain('/404');
    expect(EXPECTED_STATIC.some((r) => r.startsWith('/admin'))).toBe(false);
    expect(EXPECTED_STATIC.some((r) => r.startsWith('/sign'))).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test — expect FAIL (module doesn't exist yet)**

```bash
npx jest --rootDir=. --testMatch "**/scripts/check-build-routes.test.js" --watchAll=false
```

Expected: `Cannot find module './check-build-routes' from 'scripts/check-build-routes.test.js'` — 1 suite failed.

- [ ] **Step 4: Write `scripts/check-build-routes.js`**

Complete file:

```js
#!/usr/bin/env node
/**
 * Post-build route guard — successor to the old scripts/prerender.js ROUTES
 * allow-list invariant ("every valid public route MUST be prerendered or nginx
 * 404s it"). Under Next.js the equivalent failure mode is a page file being
 * deleted/misnamed so a URL silently drops out of the build.
 *
 * Reads .next/prerender-manifest.json (written by `next build`) and asserts
 * every route in EXPECTED_STATIC was statically generated. Dynamic routes
 * (/admin/[[...rest]], /sign/[token], /signed/[token]) are server-rendered on
 * demand and intentionally absent. The literal /404 URL is intentionally NOT
 * a page anymore — it returns a real HTTP 404 (parity-allowlisted).
 *
 * KEEP IN SYNC with src/routesManifest.js (Task 16). The parity harness
 * (scripts/seo-parity.js) independently cross-checks the live route set.
 *
 * Usage: node scripts/check-build-routes.js   (after `npx next build`)
 */
const fs = require('fs');
const path = require('path');

const EXPECTED_STATIC = [
  '/',
  '/commercial',
  '/garagemakeover',
  '/patios',
  '/colors',
  '/polished-concrete',
  '/careers',
  '/radon',
  '/thank-you',
  '/snake',
  '/privacy',
  '/terms',
  '/epoxy-flooring-albuquerque',
  '/epoxy-flooring-santa-fe',
  '/epoxy-flooring-rio-rancho',
  '/sitemap.xml',
  '/robots.txt',
];

/** Pure core: which expected routes are missing from the manifest's routes map? */
function missingRoutes(expected, manifestRoutes) {
  const have = new Set(Object.keys(manifestRoutes || {}));
  return expected.filter((route) => !have.has(route));
}

function main() {
  const manifestPath = path.join(__dirname, '..', '.next', 'prerender-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`MISSING ${manifestPath} — run \`npx next build\` first.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const missing = missingRoutes(EXPECTED_STATIC, manifest.routes);
  if (missing.length > 0) {
    console.error('FAIL — expected static routes missing from the build:');
    missing.forEach((r) => console.error(`  ${r}`));
    console.error('\nRoutes actually in the manifest:');
    Object.keys(manifest.routes || {})
      .sort()
      .forEach((r) => console.error(`  ${r}`));
    process.exit(1);
  }
  console.log(
    `OK — all ${EXPECTED_STATIC.length} expected routes present in .next/prerender-manifest.json`
  );
}

if (require.main === module) main();
module.exports = { missingRoutes, EXPECTED_STATIC };
```

- [ ] **Step 5: Run the test — expect PASS**

```bash
npx jest --rootDir=. --testMatch "**/scripts/check-build-routes.test.js" --watchAll=false
```

Expected: `Tests: 5 passed, 5 total` / `Test Suites: 1 passed, 1 total`.

- [ ] **Step 6: Run the full production build**

```bash
npx next build 2>&1 | tee /tmp/next-build.log
```

Expected (sizes/counts will vary slightly; the shape is what matters — exit code must be 0 and every route below must appear):

```
   ▲ Next.js 16.2.x

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Generating static pages

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin/[[...rest]]
├ ○ /careers
├ ○ /colors
├ ○ /commercial
├ ○ /epoxy-flooring-albuquerque
├ ○ /epoxy-flooring-rio-rancho
├ ○ /epoxy-flooring-santa-fe
├ ○ /garagemakeover
├ ○ /patios
├ ○ /polished-concrete
├ ○ /privacy
├ ○ /radon
├ ○ /robots.txt
├ ƒ /sign/[token]
├ ƒ /signed/[token]
├ ○ /sitemap.xml
├ ○ /snake
├ ○ /terms
└ ○ /thank-you

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

If the build FAILS, the error names the offending route. Common causes and fixes (all fixes go in the component/page file named by the error, then re-run the build):

| Build error | Root cause | Fix |
|---|---|---|
| `window is not defined` / `document is not defined` during "Generating static pages" | Browser API at module scope or in a render-time initializer | Guard like Snake.jsx (Task 10): lazy initializer with `typeof window !== 'undefined'`, or wrap the component in a `'use client'` file using `next/dynamic(..., { ssr: false })` |
| `useState/useEffect only works in a Client Component` | Missing `'use client'` as line 1 of an interactive component | Add the directive (see client-interactivity list in Task 8) |
| `Functions cannot be passed directly to Client Components` | A server `page.js` passes an event handler or component fn as a prop | Move the interactivity into the client component itself |
| `Module not found: require.context` | AllColors manifest port incomplete | Re-check Task 13 (`src/flakeImageManifest.json` + `resolveImg`) |
| `Module not found: react-router-dom` inside `app/(public)` pages | A ported component still imports react-router | Port to `next/link` / `next/navigation` per Task 8 rules |

- [ ] **Step 7: Run the route guard**

```bash
node scripts/check-build-routes.js
```

Expected output:

```
OK — all 17 expected routes present in .next/prerender-manifest.json
```

- [ ] **Step 8: Commit**

```bash
git add scripts/check-build-routes.js scripts/check-build-routes.test.js
git commit -m "test(build): post-build route guard — Next successor to the prerender ROUTES invariant

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If Step 6 forced fixes to page/component files, commit those separately FIRST with a message naming each fixed route, e.g. `fix(next): guard render-time window access surfaced by next build (<files>)`, same trailer.

---

### Task 18: SEO parity compare against the prod baseline → green

This is the migration's primary correctness instrument. `docs/seo-baseline.json` (Task 5) is a field-by-field snapshot of the LIVE site — status, redirects, title, description, canonical, robots meta, og:*/twitter:* tags, first H1, parsed JSON-LD, html lang — for the 16 CRA prerender routes plus 3 probes. The compare run against a local `next start` must exit 0 before Chunk 6 may begin; the same command reruns remotely in Tasks 23 and 25.

Note: the Express API does **not** need to be running — no page fetches data during SSR (e-sign/admin fetch client-side), and the harness only reads HTML.

- [ ] **Step 1: Start the production server locally**

```bash
pkill -f 'next start' 2>/dev/null; sleep 1
(npx next start -p 3000 > /tmp/next-start.log 2>&1 &)
sleep 3
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
```

Expected: `200`. If not, `cat /tmp/next-start.log` (most common: no `.next` build — rerun Task 17 Step 6).

- [ ] **Step 2: Confirm the allowlist file from Task 5 exists**

```bash
cat scripts/seo-parity-allowlist.json
```

Expected — exactly the initial allowlist created in Task 5 Step 8:

```json
{
  "/404": {
    "status": true,
    "title": true,
    "robots": true
  },
  "/sign/dummy-token-parity": {
    "noindex": true,
    "h1": true,
    "jsonLd": true
  }
}
```

(`/404`: the literal URL served HTTP 200 today as a prerendered page but is intentionally a real 404 under Next; title/robots listed defensively. `/sign/dummy-token-parity`: `noindex` flips false→true — today's nginx noindex header for `/sign/*` is broken by the try_files internal redirect, Next emits a real robots meta — an intentional improvement; that probe only compares status/redirectLocation/noindex anyway.) Field keys must match the extractor names in `scripts/seo-parity.lib.js` (`COMPARE_FIELDS`: status, redirectLocation, htmlLang, title, metaDescription, canonical, robots, noindex, ogTitle, ogDescription, ogUrl, ogImage, ogType, twitterCard, twitterTitle, twitterDescription, twitterImage, h1, jsonLd). If the file is missing, recreate it exactly as above.

- [ ] **Step 3: First compare run — triage the diffs**

```bash
node scripts/seo-parity.js compare http://127.0.0.1:3000 docs/seo-baseline.json scripts/seo-parity-allowlist.json
echo "exit: $?"
```

A first run typically prints a handful of per-route field diffs and exits 1. Work through them with this triage table. **Default stance: the baseline is truth — fix the app, don't allowlist.** Only diffs that are provably semantics-preserving may be allowlisted, and each addition must be justified in the Step 6 commit message.

| Diff pattern | Root cause | Fix |
|---|---|---|
| title/description shows `&amp;` vs `&` (e.g. `/patios`, `/colors`) | Metadata string copied with the JSX entity instead of the rendered form | Edit the page's `metadata` export to the rendered `&` form (brief rule: helmet-meta strings byte-for-byte as RENDERED) |
| `twitter:title`/`twitter:description` present on a non-home route | Root layout leaked home-only twitter fields | Only `app/(public)/page.js` sets them; remove from `app/layout.js` |
| `og:type` missing on `/`, `/garagemakeover`, `/patios`, `/polished-concrete`, location pages — or extra elsewhere | Per-page og:type not set / root default drift | Root layout provides site-wide og defaults; pages that set og:type today keep it in their own metadata (Task 9-12 specs) |
| canonical present on `/snake`, `/thank-you` | `alternates.canonical` added where today has none | Delete `alternates` from those pages (`/thank-you` keeps only `robots: { index: false, follow: true }`) |
| H1 text differs by whitespace only | JSX `<br />` collapse vs the extractor's normalization | Confirm the ported markup is unchanged; if so this is an extractor-normalization gap — fix `scripts/seo-parity.lib.js` (and its test) rather than the page |
| JSON-LD node missing / provider shape differs | Page schema not copied verbatim (e.g. garagemakeover's inline LocalBusiness provider vs location pages' `@id: …#business` ref — they differ ON PURPOSE) | Re-copy the schema object verbatim from the source component per Tasks 11-12 |
| `/garage-makeover` status `308` vs baseline `301` | Next `redirects()` with `permanent: true` emits 308; the live 301 comes from nginx (which stays in front after cutover) | THE ONE EXPECTED ADDITION: add `"/garage-makeover": { "status": true }` to `scripts/seo-parity-allowlist.json`. Status ONLY — `redirectLocation` must still match `/garagemakeover` exactly. Expect 308 again in Task 23 (direct :3000 probe) and 301 again in Task 25 (through nginx) |
| Extra `<meta name="next-size-adjust">` or similar Next-internal tags | Framework-added tags outside the compared field set | No action — the harness compares named fields, not the whole head |

- [ ] **Step 4: Fix → rebuild → re-compare loop**

After every page/layout fix:

```bash
npx next build && pkill -f 'next start'; sleep 1
(npx next start -p 3000 > /tmp/next-start.log 2>&1 &)
sleep 3
node scripts/seo-parity.js compare http://127.0.0.1:3000 docs/seo-baseline.json scripts/seo-parity-allowlist.json
echo "exit: $?"
```

Repeat until `exit: 0`. Expected final run (format is the harness's own output; the `GET` crawl lines precede it):

```
ok      /
ok      /commercial
ok      /garagemakeover
ok      /patios
ok      /colors
ok      /polished-concrete
ok      /careers
ok      /radon
ok      /thank-you
ok      /snake
==      /404
  ALLOWED status: 200 -> 404
ok      /epoxy-flooring-albuquerque
ok      /epoxy-flooring-santa-fe
ok      /epoxy-flooring-rio-rancho
ok      /privacy
ok      /terms
==      /garage-makeover
  ALLOWED status: 301 -> 308
ok      /definitely-not-a-page-xyz
==      /sign/dummy-token-parity
  ALLOWED noindex: false -> true

19 routes, 0 blocking diff(s), 3 allowlisted diff(s)
exit: 0
```

(Exactly these 3 allowlisted diffs are expected — `/404` title/robots should NOT diff since the same NotFound strings render on both sides; if extra ALLOWED lines appear, confirm each is genuinely intentional before moving on.)

- [ ] **Step 5: Sitemap and robots.txt spot checks (outside the harness's field set)**

```bash
curl -s http://127.0.0.1:3000/sitemap.xml | grep -c '<loc>'
diff <(curl -s https://www.nextlevelepoxynm.com/sitemap.xml | grep -o '<loc>[^<]*' | sort) \
     <(curl -s http://127.0.0.1:3000/sitemap.xml | grep -o '<loc>[^<]*' | sort) && echo "loc sets identical"
curl -s http://127.0.0.1:3000/robots.txt
```

Expected:

```
13
loc sets identical
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /admin/login

Sitemap: https://www.nextlevelepoxynm.com/sitemap.xml
```

(Next writes `User-Agent`; the live file has `User-agent` — the directive is case-insensitive per the robots spec, no action. Also verify lastmod parity: `curl -s http://127.0.0.1:3000/sitemap.xml | grep -c '<lastmod>'` → `13`, values per the Task 16 manifest.)

- [ ] **Step 6: Commit fixes and any allowlist changes**

```bash
git add scripts/seo-parity-allowlist.json <every page/layout/lib file edited in Steps 3-4>
git commit -m "fix(seo): parity compare green vs prod baseline (19 routes)

Allowlist additions and why:
- /garage-makeover status: Next redirects() emits 308; live 301 stays owned by nginx
<one line per any other addition — none expected beyond the Task 5 initial entries>

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

If literally nothing needed fixing (compare was green on the first run) skip the commit — nothing changed.

---

### Task 19: Playwright smoke suite

The parity harness proves the HTML is right; this proves the app *works* after hydration: nav, the money path (quote form → `/thank-you`), admin login mount, the /colors modal, and tel: links. New devDependency `@playwright/test`; the suite runs against a local production `next start` and **mocks all Google/API network calls** — no DB writes, no analytics pollution, Express not required. Deliberately out of scope here (they need real DB state): full CRM click-through and the real-token e-sign flow — those are exercised manually against staging in Task 23, where Express + MySQL are the real ones on EC2.

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: `added N packages` then a one-time Chromium download (~130-170MB) ending without error.

- [ ] **Step 2: Write `playwright.config.js`** (repo root, complete file)

```js
/**
 * Smoke suite vs a local production build.
 * Prereq: `npx next build` (webServer runs `next start`, which needs .next/).
 * Run: npm run test:smoke
 * All external (Google) and API requests are mocked in the spec — safe offline.
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npx next start -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
```

- [ ] **Step 3: Write `tests/smoke.spec.js`** (complete file; selectors verified against the current components)

```js
const { test, expect } = require('@playwright/test');

// Keep every run offline-safe and out of GA4/Ads data: the GtagLoader injects
// googletagmanager.com on public routes — abort it (analytics.js helpers
// fail silently by design when gtag never loads).
test.beforeEach(async ({ page }) => {
  await page.route(
    /googletagmanager\.com|google-analytics\.com|googleadservices\.com/,
    (route) => route.abort()
  );
});

test('home renders hero H1 and tel: links', async ({ page }) => {
  await page.goto('/');
  // Hero.jsx Headline: "If Your Garage Could Talk, / It'd Call Us"
  await expect(page.locator('h1')).toContainText('If Your Garage Could Talk');
  // Header PhoneButton + ContactForm PhoneLink both use tel:5053524674
  expect(await page.locator('a[href="tel:5053524674"]').count()).toBeGreaterThan(0);
});

test('client-side nav: header link → /commercial', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Commercial', exact: true }).first().click();
  await expect(page).toHaveURL('/commercial');
  await expect(page.locator('h1')).toContainText('Industrial-Grade Floors');
});

test('quote form submits (API mocked) and hard-navigates to /thank-you', async ({ page }) => {
  // Intercept the lead POST — never hit Express/MySQL from the smoke suite.
  await page.route('**/api/leads', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  );
  await page.goto('/');
  await page.locator('#user_name').fill('Playwright Smoke');
  await page.locator('#user_number').fill('505-000-0000');
  await page.locator('#user_email').fill('smoke@example.com');
  await page.locator('#area_desired').fill('2-car garage (automated smoke test)');
  await page.getByRole('button', { name: 'Get My Free Quote →' }).click();
  // ContactForm does window.location.href = '/thank-you' — a deliberate hard
  // navigation so the Ads AW- config re-fires. Assert the full-page nav.
  await page.waitForURL('**/thank-you');
  await expect(page).toHaveTitle('Thanks — Next Level Epoxy');
});

test('admin login page mounts (client-only react-router SPA)', async ({ page }) => {
  await page.goto('/admin/login');
  // AdminApp is next/dynamic ssr:false — these appear only after hydration.
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('/colors: swatch modal opens and Escape closes it', async ({ page }) => {
  await page.goto('/colors');
  // AllColors Cards carry aria-label="View <name>"
  await page.locator('[aria-label^="View "]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
```

- [ ] **Step 4: Add the npm script**

Edit `package.json` — the scripts block currently ends (post-Task 5/6 state):

Before:

```json
    "test:server": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --watchAll=false",
```

After:

```json
    "test:server": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --watchAll=false",
    "test:smoke": "playwright test",
```

- [ ] **Step 5: Ignore Playwright artifacts**

```bash
printf '\n# playwright\n/test-results/\n/playwright-report/\n' >> .gitignore
tail -3 .gitignore
```

Expected tail: `# playwright`, `/test-results/`, `/playwright-report/`.

- [ ] **Step 6: Run the suite — expect FAIL first if no build, then PASS**

If `.next/` is stale or missing the webServer refuses to start (`next start` errors) — rebuild first. The leading `pkill` matters: Task 18 leaves a `next start` running, and with `reuseExistingServer: true` Playwright would reuse that stale server — which serves the deleted build's chunks:

```bash
pkill -f 'next start' 2>/dev/null; sleep 1; npx next build && npm run test:smoke
```

Expected output (worker count varies):

```
Running 5 tests using 1 worker
  ✓  home renders hero H1 and tel: links
  ✓  client-side nav: header link → /commercial
  ✓  quote form submits (API mocked) and hard-navigates to /thank-you
  ✓  admin login page mounts (client-only react-router SPA)
  ✓  /colors: swatch modal opens and Escape closes it

  5 passed
```

If a test fails, `npx playwright test --headed <spec>:<line>` to watch it; failures here usually mean a hydration error (check the browser console via `--headed`) or a selector drift from a port edit — fix the component, `npx next build`, rerun.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.js tests/smoke.spec.js package.json package-lock.json .gitignore
git commit -m "test(smoke): playwright suite vs local next start — nav, mocked quote form, admin mount, colors modal, tel links

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 20: Test-infra port — babel-jest + `test:node`

Two src tests (`src/admin/payPeriods.test.js`, `src/admin/halfStep.test.js`) are ESM and today run ONLY under CRA's `react-scripts test`. Task 26 deletes react-scripts, so they must run under plain jest first: babel-jest + a Babel config transpiles them, and `test:server` becomes `test:node` covering all three surfaces (server, scripts, src/admin). CRA test remnants (`src/NotFound.test.jsx`, `src/setupTests.js`, the `"test": "react-scripts test"` script) are deliberately left for Task 26 — NotFound.test.jsx needs jsdom/jest-dom which plain jest here doesn't configure, and the `**/src/admin/**` glob deliberately excludes it.

- [ ] **Step 1: Baseline — current node tests green**

```bash
npm run test:server
```

Expected: `Test Suites: 6 passed, 6 total` — the full `{server,scripts}` surface as it stands entering this task: `server/config/payPeriods.test.js`, `server/util/documentStorage.test.js`, `scripts/seo-parity.test.js` (Task 5), `scripts/generate-flake-manifest.test.js` (Task 13), `scripts/routes-manifest.test.js` (Task 16), `scripts/check-build-routes.test.js` (Task 17).

- [ ] **Step 2: Demonstrate the failure (TDD for config)**

```bash
npx jest --rootDir=. --testMatch "**/src/admin/**/*.test.js" --watchAll=false
```

Expected FAIL — both suites with `SyntaxError: Cannot use import statement outside a module` (no transform configured for ESM).

- [ ] **Step 3: Install the Babel toolchain**

```bash
npm install --save-dev babel-jest@^27.5.1 @babel/core @babel/preset-env @babel/preset-react
```

`babel-jest` is pinned to major 27 to match the explicit `jest@^27.5.1` from Task 4 — mismatched majors throw at jest startup. Expected: `added N packages`.

- [ ] **Step 4: Write `babel.config.js`** (repo root, complete file)

```js
/**
 * Consumed ONLY by babel-jest (jest 27) to transpile the ESM test files under
 * src/admin/. Next.js must NOT compile with Babel — a detected Babel config
 * can knock out Next's built-in styled-components compiler (SSR class-name
 * mismatch) or trip the Turbopack build. So: outside NODE_ENV=test this file
 * exports an empty config. Guard verified in this task's Step 7 (next build
 * clean + data-styled present in served HTML + parity still green).
 */
module.exports = function (api) {
  // api.env() registers env-based caching — no separate api.cache() call.
  const isTest = api.env('test');
  if (!isTest) return {};
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  };
};
```

(jest sets `NODE_ENV=test` automatically; babel-jest picks this file up with zero jest config.)

- [ ] **Step 5: Re-run the src/admin tests — expect PASS**

```bash
npx jest --rootDir=. --testMatch "**/src/admin/**/*.test.js" --watchAll=false
```

Expected: `Test Suites: 2 passed, 2 total` / `Tests: 18 passed, 18 total` (payPeriods.test.js: 13 tests over the owner-provided PERIOD_FIXTURE boundaries; halfStep.test.js: 5 tests of 0.5-step validation).

- [ ] **Step 6: Rename the script to `test:node` with both globs**

jest's `--testMatch` is an array option — repeated flags accumulate (verify below). Edit `package.json`:

Before:

```json
    "test:server": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --watchAll=false",
```

After:

```json
    "test:node": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --testMatch \"**/src/admin/**/*.test.js\" --watchAll=false",
```

Verify the flag merge, then run the full surface:

```bash
npx jest --rootDir=. --testMatch "**/{server,scripts}/**/*.test.js" --testMatch "**/src/admin/**/*.test.js" --showConfig 2>/dev/null | grep -A3 '"testMatch"'
npm run test:node
```

Expected: `--showConfig` prints a `"testMatch"` array containing BOTH globs:

```
    "testMatch": [
      "**/{server,scripts}/**/*.test.js",
      "**/src/admin/**/*.test.js"
    ],
```

then:

```
Test Suites: 8 passed, 8 total
```

(server ×2, scripts ×4, src/admin ×2. `npm run test:server` now errors with `Missing script` — that's the point; nothing else in the repo invokes it: the remaining `test:server` mentions are dated historical plan docs, left untouched per scope discipline. Task 27 updates the living docs/memory to `test:node`.)

- [ ] **Step 7: Prove the Babel config did not leak into the Next build**

```bash
npx next build 2>&1 | tee /tmp/next-build-postbabel.log
grep -i babel /tmp/next-build-postbabel.log; echo "grep exit: $?"
pkill -f 'next start' 2>/dev/null; sleep 1
(npx next start -p 3000 > /tmp/next-start.log 2>&1 &)
sleep 3
curl -s http://127.0.0.1:3000/ | grep -c 'data-styled'
node scripts/seo-parity.js compare http://127.0.0.1:3000 docs/seo-baseline.json scripts/seo-parity-allowlist.json
echo "exit: $?"
```

Expected: build exits 0 with **no** Babel mention (`grep exit: 1`), `data-styled` count ≥ 1 (styled-components still SSR'd by Next's own compiler), parity `exit: 0`.

> **Fallback (only if Step 7 fails):** Next detects Babel config *files by name* (`babel.config.js`/`.babelrc`), so even the empty-config guard may trip it — a `grep` hit like `Disabled SWC as replacement for Babel` or a Turbopack "Babel is not supported" error means the guard was not enough. Scope Babel away from Next entirely:
>
> ```bash
> rm babel.config.js
> ```
>
> Create `babel.jest.config.js` (complete file — a name Next does NOT scan for):
>
> ```js
> /**
>  * Babel config for babel-jest ONLY (wired via jest.config.js transform).
>  * Named so Next.js never detects it — next build stays on SWC/Turbopack.
>  */
> module.exports = {
>   presets: [
>     ['@babel/preset-env', { targets: { node: 'current' } }],
>     ['@babel/preset-react', { runtime: 'automatic' }],
>   ],
> };
> ```
>
> Create `jest.config.js` (complete file; CLI `--rootDir`/`--testMatch` flags coexist fine with a config file):
>
> ```js
> module.exports = {
>   transform: {
>     '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.jest.config.js' }],
>   },
> };
> ```
>
> Re-run Steps 5-7 (all expectations unchanged); in the Step 9 commit, `git add babel.jest.config.js jest.config.js` instead of `babel.config.js` and mention the fallback in the message body.

- [ ] **Step 8: Run the complete verification stack one last time**

The chunk's exit criteria, all in one pass:

```bash
npm run test:node && node scripts/check-build-routes.js && npm run test:smoke && echo "CHUNK 5 GREEN"
```

Expected: `Test Suites: 8 passed`, `OK — all 17 expected routes present…`, `5 passed`, `CHUNK 5 GREEN`. Chunk 6 (deploy & cutover) must not start until this line prints.

- [ ] **Step 9: Commit**

```bash
git add babel.config.js package.json package-lock.json
git commit -m "test(infra): babel-jest for ESM src/admin tests + rename test:server -> test:node (8 suites)

Babel config is NODE_ENV=test-scoped so Next's own compiler (styled-components
SSR) is untouched — verified via clean next build + parity re-run.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

## Chunk 6: Deploy & cutover

Context for the executor: today nginx serves the whole public site as static prerendered files from `/var/www/html/my-react-app/build` and only proxies `/api/*` to Express on `127.0.0.1:4242` (PM2 app `nextlevel-api`). After this chunk, nginx proxies **everything except `/api/*`** to the Next.js standalone server on `127.0.0.1:3000` (new PM2 app `nextlevel-web`). The old static build stays untouched on disk as the instant-rollback path for ≥2 weeks.

All EC2 commands in this chunk assume these shell variables are set in your current terminal:

```bash
KEY=/Users/boshao/Downloads/nextlevel.pem
SSH="ssh -i $KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=15 ubuntu@3.143.4.46"
```

(Usage: `$SSH 'remote command'` — keep remote commands single-quoted so `$(...)` and `$vars` expand on the box, not locally.)

---

### Task 21: deploy.sh v2 + ecosystem.config.js (keep CRA deploy as deploy-cra.sh)

Local-only task — nothing touches EC2 yet. The current `deploy.sh` builds CRA + puppeteer-prerender and copies into the nginx web root; v2 builds Next standalone and rsyncs to a new `web/` directory on the box. The old script must survive as `deploy-cra.sh` until the Task 26 cleanup (it is the app-level rollback path during the soak).

- [ ] **Step 1: Preserve the CRA deploy script**

```bash
cd /Users/boshao/projects/nextlevel
cp deploy.sh deploy-cra.sh
chmod +x deploy-cra.sh
```

Expected: `ls -la deploy-cra.sh` shows an executable file identical to the current `deploy.sh` (28 lines, starts `#!/bin/bash`).

- [ ] **Step 2: Create `ecosystem.config.js` (NEW file, repo root, complete)**

```js
// PM2 config for the Next.js web server on EC2.
// Deployed to /home/ubuntu/nextlevel-crm/ecosystem.config.js by deploy.sh;
// paths below are EC2 paths, not laptop paths.
//
// nextlevel-api (Express on :4242) predates this file and remains an ad-hoc
// PM2 process (created 2026-04 via `pm2 start server/index.js --name nextlevel-api`).
// deploy.sh restarts it by name; its max_memory_restart is set once via CLI
// in the EC2-prep task. Do NOT add it here without migrating its saved state.
module.exports = {
  apps: [
    {
      name: 'nextlevel-web',
      cwd: '/home/ubuntu/nextlevel-crm/web',
      script: 'server.js', // .next/standalone entrypoint (rsync'd to web/server.js)
      env: {
        PORT: 3000,
        HOSTNAME: '127.0.0.1', // loopback only — nginx is the public face
        NODE_ENV: 'production',
      },
      max_memory_restart: '350M', // 954MB box shared with MySQL + Express
    },
  ],
};
```

- [ ] **Step 3: Verify the config parses**

```bash
node -p "require('./ecosystem.config.js').apps[0].name"
```

Expected output: `nextlevel-web`

- [ ] **Step 4: Replace `deploy.sh` with v2 (complete file — overwrites the old content)**

```bash
#!/bin/bash
# Deploy v2 — Next.js standalone + Express API → EC2.
#
# PREREQS (laptop-only build — the 954MB EC2 box never builds):
#   - gitignored media present locally: public/images/*, public/img/,
#     public/videos/, src/images/, src/videos/  (rsync of public/ ships them)
#   - key at /Users/boshao/Downloads/nextlevel.pem
#
# Layout on EC2 after deploy:
#   /home/ubuntu/nextlevel-crm/web/           ← .next/standalone/ (server.js + bundled node_modules)
#   /home/ubuntu/nextlevel-crm/web/.next/static/  ← hashed client assets
#   /home/ubuntu/nextlevel-crm/web/public/    ← media, favicons, og cards
#   /home/ubuntu/nextlevel-crm/server/        ← Express API (unchanged path)
#
# The CRA-era deploy is preserved as ./deploy-cra.sh until post-cutover cleanup.
set -e

EC2="ubuntu@3.143.4.46"
KEY="/Users/boshao/Downloads/nextlevel.pem"
SSH_OPTS="-o StrictHostKeyChecking=no -o ServerAliveInterval=15"
SSH="ssh -i $KEY $SSH_OPTS"
RSH="ssh -i $KEY $SSH_OPTS"
REMOTE="/home/ubuntu/nextlevel-crm"

# rsync with one automatic retry (historical flakiness; --partial resumes)
rs() {
  rsync -az --partial -e "$RSH" "$@" \
    || { echo "⚠️  rsync failed — retrying in 3s..."; sleep 3; rsync -az --partial -e "$RSH" "$@"; }
}

echo "🔨 Building Next.js app (standalone)..."
# npx: works both before and after the Task 26 build-script rename.
npx next build

echo "📦 Syncing standalone server → EC2..."
rs .next/standalone/ "$EC2:$REMOTE/web/"

echo "📦 Syncing static assets → EC2..."
rs .next/static/ "$EC2:$REMOTE/web/.next/static/"

echo "📦 Syncing public/ (media + favicons) → EC2..."
rs public/ "$EC2:$REMOTE/web/public/"

echo "📦 Syncing PM2 ecosystem config → EC2..."
rs ecosystem.config.js "$EC2:$REMOTE/"

echo "📦 Syncing server → EC2..."
rs server/ "$EC2:$REMOTE/server/"

echo "📦 Syncing package files → EC2..."
rs package.json package-lock.json .npmrc "$EC2:$REMOTE/"   # .npmrc: legacy-peer-deps for the React 19 bump — EC2 npm install ERESOLVEs without it (Task 26 drops it)

echo "📦 Installing deps on EC2 (Express + the Next tree until Task 26 shrinks it; the web app runs from the self-contained standalone bundle)..."
$SSH $EC2 "cd $REMOTE && npm install --omit=dev --no-audit --no-fund 2>&1 | tail -3"

echo "🔄 Restarting PM2 apps..."
$SSH $EC2 "pm2 startOrRestart $REMOTE/ecosystem.config.js --only nextlevel-web && pm2 restart nextlevel-api"

echo "🩺 Health check (Next on :3000)..."
$SSH $EC2 "sleep 2 && curl -sf http://127.0.0.1:3000/ | head -c 200 && echo"

echo "✅ Deploy complete — https://www.nextlevelepoxynm.com"
```

Notes baked into the design (do not "fix" these):
- No `--delete` on the `web/` rsync — old hashed chunks accumulate harmlessly between deploys (same tradeoff as the CRA-era rsync); disk is 11GB free.
- The first deploy ships `.next/standalone/node_modules` (~tens of MB) — expect several minutes on the first run, delta-only afterwards.
- `server/` rsync + `npm install --omit=dev` are byte-identical in spirit to the old script; the box's `node_modules` serves Express only.

- [ ] **Step 5: Syntax-check both scripts**

```bash
bash -n deploy.sh && bash -n deploy-cra.sh && echo SYNTAX-OK
```

Expected output: `SYNTAX-OK`

- [ ] **Step 6: Confirm standalone artifacts exist locally** (produced by Task 17's `next build`; rerun `npx next build` if you cleaned `.next/`)

```bash
ls .next/standalone/server.js .next/standalone/node_modules >/dev/null && echo ARTIFACTS-OK
```

Expected output: `ARTIFACTS-OK`

- [ ] **Step 7: Commit**

```bash
git add deploy.sh deploy-cra.sh ecosystem.config.js
git commit -m "feat(deploy): deploy.sh v2 for Next standalone + PM2 ecosystem config

Old CRA deploy preserved as deploy-cra.sh until post-cutover cleanup.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 22: EC2 prep — swap, Node 20, PM2 hygiene, web dir

> ⚠️ **HUMAN CHECKPOINT:** confirm with Bo before running this task.

This task changes the production box (but not the live site's serving path): adds a 2GB swapfile as OOM insurance for the 954MB box, upgrades Node 18.20.4 (EOL) → 20 LTS via NodeSource, restarts `nextlevel-api` onto the new Node with a memory-restart cap, and creates the directories Tasks 23/24 need. Do this on a low-traffic evening; `nextlevel-api` restarts (sub-second CRM blip), the public static site is unaffected.

- [ ] **Step 1: Preflight snapshot**

```bash
$SSH 'free -h && node -v && df -h / | tail -1 && pm2 ls'
```

Expected: `Mem: 954Mi` total with `Swap: 0B` (no swap yet), `v18.20.4`, ~11G available on `/`, PM2 table showing `nextlevel-api` online. If swap already exists or Node is already 20.x, skip the corresponding step below.

- [ ] **Step 2: Create and enable a 2GB swapfile**

```bash
$SSH 'sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && free -h'
```

Expected: last line of `free -h` shows `Swap: 2.0Gi` total.

- [ ] **Step 3: Persist swap across reboots**

```bash
$SSH 'grep -q "^/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab; tail -1 /etc/fstab'
```

Expected output includes: `/swapfile none swap sw 0 0`

- [ ] **Step 4: Upgrade Node 18 → 20 LTS (NodeSource apt — n/nvm are not installed on this box)**

```bash
$SSH 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs && node -v'
```

Expected: apt installs `nodejs` 20.x; final line `v20.x.x`.

- [ ] **Step 5: Refresh the PM2 daemon onto Node 20 and cap the API's memory**

```bash
$SSH 'pm2 update && pm2 restart nextlevel-api --max-memory-restart 300M && pm2 save'
```

Expected: `pm2 update` reloads the daemon and resurrects `nextlevel-api`; restart line shows `[nextlevel-api](0) ✓`; `pm2 save` writes the dump. Then verify the cap took:

```bash
$SSH 'pm2 describe nextlevel-api | grep -i "max memory\|node.js version"'
```

Expected: max memory restart `300M`, node.js version `20.x`.

- [ ] **Step 6: Verify Express is healthy on Node 20** (the health route is `server/index.js:96`)

```bash
$SSH 'curl -sf http://127.0.0.1:4242/api/health' && echo && curl -sf https://www.nextlevelepoxynm.com/api/health
```

Expected output (both lines): `{"status":"ok"}` — loopback proves the process, the https call proves the nginx `/api/` proxy path end-to-end. Ask Bo to do one CRM login in the browser as a final sanity check.

- [ ] **Step 7: Create the Next web dir and the nginx-backup dir (used by Tasks 23/24)**

```bash
$SSH 'mkdir -p /home/ubuntu/nextlevel-crm/web /home/ubuntu/nginx-backups && ls -d /home/ubuntu/nextlevel-crm/web /home/ubuntu/nginx-backups'
```

Expected: both paths printed.

- [ ] **Step 8: No commit** — this task changes only the EC2 box; there are no repo changes. (Record the outcome in memory during Task 27.)

---

### Task 23: Staging deploy + remote parity against :3000

> ⚠️ **HUMAN CHECKPOINT:** confirm with Bo before running this task.

First real Next deploy. Zero user impact by design: `nextlevel-web` comes up on loopback :3000 **alongside** the live static site — nginx still serves the old build until Task 24. `nextlevel-api` is restarted by the script, but the `server/` tree on the branch is identical to what Task 2 already deployed, so it's a plain restart.

- [ ] **Step 1: Preflight — branch, tests, local parity all green**

```bash
git branch --show-current
npm run test:node
```

Expected: `nextjs-migration`; jest green (all suites pass — server, scripts, src/admin). If Task 18's local parity compare wasn't run recently, re-run it against a local `next start` before shipping.

- [ ] **Step 2: Deploy**

```bash
./deploy.sh
```

Expected output, in order: `next build` route table (all routes ○/ƒ, no errors); six rsync sections (first `web/` sync is the big one — it ships `.next/standalone/node_modules`); `npm install` tail on EC2; PM2 section showing `[nextlevel-web] launched (1 instances)` (first run) or restart, then `[nextlevel-api](0) ✓`; health check printing the first 200 bytes of the home page HTML starting `<!DOCTYPE html>`; `✅ Deploy complete`.

- [ ] **Step 3: Persist the new PM2 app across reboots** (deploy.sh deliberately doesn't `pm2 save`; do it once now)

```bash
$SSH 'pm2 save && pm2 ls'
```

Expected: dump saved; table shows **both** `nextlevel-api` and `nextlevel-web` online.

- [ ] **Step 4: Inspect Next's boot log**

```bash
$SSH 'pm2 logs nextlevel-web --lines 20 --nostream'
```

Expected: `▲ Next.js 16.x` / `- Local: http://127.0.0.1:3000` / `✓ Ready in …ms`, no error lines.

- [ ] **Step 5: Open an SSH tunnel and run the parity harness against staging** (the harness runs on the laptop; the tunnel makes EC2's loopback :3000 reachable as local :3300)

```bash
ssh -i $KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -f -N -L 3300:127.0.0.1:3000 ubuntu@3.143.4.46
node scripts/seo-parity.js compare http://127.0.0.1:3300 docs/seo-baseline.json scripts/seo-parity-allowlist.json
echo "exit=$?"
```

Expected: per-route lines print lowercase `ok` for all routes, with exactly the same 3 allowlisted diffs as Task 18's final local run: `/404` `ALLOWED status: 200 -> 404` (status only), `/garage-makeover` `ALLOWED status: 301 -> 308` (Next's `redirects()` `permanent: true` emits 308 when :3000 is hit directly; nginx keeps answering 301 in front), `/sign/dummy-token-parity` `ALLOWED noindex: false -> true` — then final `exit=0`. **This is the cutover gate — Task 24 is forbidden until this exits 0.** If it fails: fix locally, commit on the branch, re-run `./deploy.sh`, re-run compare. Repeat until green.

- [ ] **Step 6: Manual staging smoke over the tunnel**

```bash
curl -s http://127.0.0.1:3300/ | grep -o '<title>[^<]*</title>'
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3300/colors
curl -s http://127.0.0.1:3300/admin/login | grep -c 'noindex'
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:3300/garage-makeover
```

Expected: `<title>Epoxy Flooring Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level Epoxy</title>` (SSR HTML escapes the ampersand); `200`; `1` (or more); `308 http://127.0.0.1:3300/garagemakeover` (308 not 301 — that's Next answering directly; after the Task 24 flip the public URL keeps getting nginx's 301, verified there).

- [ ] **Step 7: Memory check under load, then close the tunnel**

```bash
$SSH 'free -h && pm2 ls'
pkill -f "3300:127.0.0.1:3000"
```

Expected: `nextlevel-web` RSS roughly 100–250MB, box not swapping heavily (swap used well under 500Mi). Record the numbers — Task 25 compares against them.

- [ ] **Step 8: Commit** — only if Step 5 forced fixes (they were committed inside the loop). Otherwise no repo changes in this task; nothing to commit.

---

### Task 24: nginx cutover

> ⚠️ **HUMAN CHECKPOINT:** confirm with Bo before running this task.

The flip. nginx's `location /` switches from static `try_files` to `proxy_pass http://127.0.0.1:3000`. The complete replacement config below was derived line-by-line from the live `/etc/nginx/sites-enabled/default` captured 2026-07-20 — every existing block was consciously kept or dropped:

- **KEPT verbatim:** `$robots_tag` map, all three canonical-redirect server blocks (:80 all-hosts, coatings HTTPS, apex HTTPS), certbot cert/include lines, `server_tokens off`, `/api/` proxy, `/admin` noindex+no-store headers, `/garage-makeover` 301, all security headers in `location /` (HSTS, nosniff, Referrer-Policy, XFO, CSP frame-ancestors, Permissions-Policy, X-Robots-Tag map, Cache-Control no-cache), the two `deny` blocks. gzip lives in `/etc/nginx/nginx.conf`'s http block (2026-06-11 fix) — untouched, still compresses proxied responses.
- **DROPPED:** `root`/`index` (nothing is served from disk anymore), `/static/` CRA-asset block, `/sign/`+`/signed/` SPA-fallback blocks (Next SSRs them; noindex + no-referrer now come from page metadata — note the *header* Referrer-Policy for /sign becomes the generic `strict-origin-when-cross-origin`, but the page's `<meta name="referrer" content="no-referrer">` still governs outgoing referrers), `error_page 404` + `try_files` (Next returns real 404s natively).
- **NEW:** `location /_next/static/` immutable-cache proxy; `proxy_hide_header Cache-Control` wherever we `add_header Cache-Control`, so exactly one Cache-Control header reaches clients (Next sets its own; duplicates would be a parity regression).

- [ ] **Step 1: Create `nginx-default.conf` (NEW file, repo root, complete — this is the full target content of `/etc/nginx/sites-enabled/default`)**

```nginx
# /etc/nginx/sites-enabled/default — Next.js era (cutover 2026-07)
# Source of truth lives in the repo (nginx-default.conf); scp'd to the box.
# Pre-cutover config backed up in /home/ubuntu/nginx-backups/.
# gzip: configured in /etc/nginx/nginx.conf http block — do not duplicate here.

# Original request URI survives internal redirects, so this correctly tags
# /admin/*. Non-admin paths get "all" (harmless no-op).
map $request_uri $robots_tag {
    default            "all";
    ~^/admin           "noindex, nofollow";
}

# ============================================================
#  HTTP (:80) — all hosts → canonical HTTPS www
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name nextlevelepoxynm.com www.nextlevelepoxynm.com
                nextlevelepoxycoatings.com www.nextlevelepoxycoatings.com;
    return 301 https://www.nextlevelepoxynm.com$request_uri;
}

# ============================================================
#  coatings.com HTTPS → canonical nm www
# ============================================================
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name nextlevelepoxycoatings.com www.nextlevelepoxycoatings.com;
    ssl_certificate /etc/letsencrypt/live/nextlevelepoxynm.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nextlevelepoxynm.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    return 301 https://www.nextlevelepoxynm.com$request_uri;
}

# ============================================================
#  apex nextlevelepoxynm.com HTTPS → www (canonical consistency:
#  JSON-LD / sitemap / <link rel=canonical> all use www)
# ============================================================
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name nextlevelepoxynm.com;
    ssl_certificate /etc/letsencrypt/live/nextlevelepoxynm.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nextlevelepoxynm.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    return 301 https://www.nextlevelepoxynm.com$request_uri;
}

# ============================================================
#  MAIN — www.nextlevelepoxynm.com HTTPS → Next.js on 127.0.0.1:3000
#  (Express API on 127.0.0.1:4242 keeps its own proxy block)
# ============================================================
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.nextlevelepoxynm.com;
    ssl_certificate /etc/letsencrypt/live/nextlevelepoxynm.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nextlevelepoxynm.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    server_tokens off;

    # ---- API proxy (Express on loopback) — unchanged from CRA era ----
    location /api/ {
        client_max_body_size 30M;
        proxy_pass http://localhost:4242;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ---- Hashed Next build assets: cache hard (path changes on rebuild) ----
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;  # ours below is the single source of truth
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # ---- Admin SPA (rendered by Next, client-only): keep crawlers out ----
    location ^~ /admin {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-store" always;
    }

    # SEO: clean server 301 for legacy path alias (kept; also in next.config.js)
    location = /garage-makeover { return 301 https://www.nextlevelepoxynm.com/garagemakeover; }

    # ---- Everything else → Next.js SSR (pages, /sign, /signed, public/ media) ----
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;  # keep CRA-era "no-cache" policy, not Next's s-maxage hints
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header Content-Security-Policy "frame-ancestors 'self' https://codelabs88.com" always;
        add_header Permissions-Policy "autoplay=(self \"https://codelabs88.com\")" always;
        add_header X-Robots-Tag $robots_tag always;
        add_header Cache-Control "no-cache" always;
    }

    location ~ /\. { deny all; }
    location ~* /(\.|/logs/|/private/) { deny all; }
}
```

- [ ] **Step 2: Drift check — confirm the live config still matches the 2026-07-20 capture this file was derived from**

```bash
$SSH 'sudo nginx -t && grep -c "location" /etc/nginx/sites-enabled/default'
```

Expected: `syntax is ok` / `test is successful`, and location count `9` (api, static, admin, sign, signed, garage-makeover, /, and 2 deny blocks). If the count differs, the box was edited since capture — **stop**, pull the live file (`$SSH 'cat /etc/nginx/sites-enabled/default'`), reconcile any new block into `nginx-default.conf`, and only then continue.

- [ ] **Step 3: Back up the live config OUTSIDE sites-enabled** (incident-hardened runbook — a copy inside sites-enabled would be loaded by nginx and take the site down)

```bash
$SSH 'sudo cp /etc/nginx/sites-enabled/default /home/ubuntu/nginx-backups/default.pre-next.$(date +%Y%m%d-%H%M%S) && ls -la /home/ubuntu/nginx-backups/'
```

Expected: listing shows `default.pre-next.<timestamp>`. Note the exact filename — the rollback command needs it.

- [ ] **Step 4: Ship and install the new config**

```bash
scp -i $KEY -o StrictHostKeyChecking=no nginx-default.conf ubuntu@3.143.4.46:/home/ubuntu/default.new
$SSH 'sudo cp /home/ubuntu/default.new /etc/nginx/sites-enabled/default && sudo nginx -t'
```

Expected: `nginx: the configuration file /etc/nginx/nginx.conf syntax is ok` / `nginx: configuration file /etc/nginx/nginx.conf test is successful`. **If `nginx -t` fails, do NOT reload** — the running nginx still serves the old config; restore the backup (Step 7 command) and debug.

- [ ] **Step 5: Reload**

```bash
$SSH 'sudo systemctl reload nginx && systemctl is-active nginx'
```

Expected: `active`

- [ ] **Step 6: Immediate live verification (from the laptop, real internet path)**

```bash
curl -s https://www.nextlevelepoxynm.com/ | grep -o '<title>[^<]*</title>'
curl -sI https://www.nextlevelepoxynm.com/ | grep -iE 'HTTP|x-robots|cache-control' 
curl -s -o /dev/null -w '%{http_code}\n' https://www.nextlevelepoxynm.com/definitely-not-a-page-xyz
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.nextlevelepoxynm.com/garage-makeover
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://nextlevelepoxynm.com/colors
curl -s https://www.nextlevelepoxynm.com/api/health
curl -sI https://www.nextlevelepoxynm.com/admin | grep -i x-robots
curl -s -o /dev/null -w '%{http_code}\n' https://www.nextlevelepoxynm.com/_next/static/ 2>/dev/null || true
```

Expected: home `<title>Epoxy Flooring Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level Epoxy</title>` (SSR HTML escapes the ampersand); `HTTP/... 200` + `x-robots-tag: all` + single `cache-control: no-cache`; `404`; `301 https://www.nextlevelepoxynm.com/garagemakeover`; `301 https://www.nextlevelepoxynm.com/colors`; `{"status":"ok"}`; `x-robots-tag: noindex, nofollow`. For the final `/_next/static/` probe any HTTP status is acceptable — it is informational only (it proves nginx routes the `/_next/static` prefix to :3000, not what status the directory URL returns). Also load the site in a real browser: home page renders, nav works, /colors modal opens, a quick admin login works.

- [ ] **Step 7: Rollback runbook (do NOT run unless something is wrong — record it now)**

```bash
# Instant full-site revert to the CRA static build (old build untouched in
# /var/www/html/my-react-app/build). <TIMESTAMP> = filename from Step 3.
$SSH 'sudo cp /home/ubuntu/nginx-backups/default.pre-next.<TIMESTAMP> /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx'
# Optional: pm2 stop nextlevel-web   (harmless to leave running on loopback)
```

- [ ] **Step 8: Commit**

```bash
git add nginx-default.conf
git commit -m "feat(infra): nginx config for Next.js cutover

location / now proxies to nextlevel-web on 127.0.0.1:3000; /api proxy,
www-canonical redirects, security headers, X-Robots map and /garage-makeover
301 kept; CRA static/try_files, error_page 404 and /sign SPA-fallback dropped.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 25: Post-cutover verification, monitoring & 2-week soak

Read-only against production (no checkpoint needed, but do it immediately after Task 24, same evening).

- [ ] **Step 1: Full parity compare against the LIVE site**

```bash
node scripts/seo-parity.js compare https://www.nextlevelepoxynm.com docs/seo-baseline.json scripts/seo-parity-allowlist.json
echo "exit=$?"
```

Expected: `exit=0` — every route byte-matches the pre-migration baseline except the allowlisted `/404` + `/sign/dummy-token-parity` fields. Any new diff is a P0: diagnose immediately; if it can't be fixed within the evening, execute the Task 24 Step 7 rollback.

- [ ] **Step 2: Sitemap + robots parity**

```bash
curl -s https://www.nextlevelepoxynm.com/sitemap.xml | grep -c '<loc>'
curl -s https://www.nextlevelepoxynm.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | head -3
curl -s https://www.nextlevelepoxynm.com/robots.txt
```

Expected: `13` locs; first entries are `https://www.nextlevelepoxynm.com/` etc. (www host, no /thank-you, no /snake); robots.txt shows `Allow: /`, `Disallow: /admin/`, `Disallow: /admin/login`, `Sitemap: https://www.nextlevelepoxynm.com/sitemap.xml`.

- [ ] **Step 3: GSC spot checks (manual — walk Bo through it or do it in his browser session)**

In Google Search Console (property `www.nextlevelepoxynm.com`), URL-inspect these three: `/`, `/garagemakeover`, `/epoxy-flooring-albuquerque`. For each: **Test live URL** → expect "URL is available to Google", rendered HTML shows the correct `<title>` and canonical. Do NOT request re-indexing — the URL set and meta are unchanged by design; let Google recrawl naturally.

- [ ] **Step 4: Record the resource baseline and set up the soak watch**

```bash
$SSH 'pm2 ls && free -h && uptime'
```

Expected: both apps online with `↺` (restart count) stable; note `nextlevel-web` memory. During the soak, re-run this every couple of days — a climbing `↺` on `nextlevel-web` means `max_memory_restart: 350M` is firing (investigate a leak before it becomes user-visible).

- [ ] **Step 5: Write down the soak rules (they gate Tasks 26–27)**

**2-week soak — until ~2026-08-03.** Keep all three rollback layers untouched: (1) old static build in `/var/www/html/my-react-app/build`, (2) nginx backup in `/home/ubuntu/nginx-backups/`, (3) `deploy-cra.sh` in the repo. **Rollback criteria** (any one triggers the Task 24 Step 7 revert + investigation): GSC coverage/impressions drop materially with crawl errors on previously-fine URLs; repeated `nextlevel-web` OOM restarts or box-wide swap thrashing; lead-form submissions stop arriving (check CRM + Resend); widespread hydration errors reported/observed. During the soak, deploys via `./deploy.sh` are fine — they only touch `web/` + `server/`.

- [ ] **Step 6: Commit** — only if Step 1 required an allowlist addition (`git add scripts/seo-parity-allowlist.json`, message `chore(parity): allowlist post-cutover diff — <reason>` with the Co-Authored-By trailer). Otherwise no repo changes; nothing to commit.

---

### Task 26: Cleanup commit — remove the CRA toolchain

> ⚠️ **HUMAN CHECKPOINT:** confirm with Bo before running this task.

**Run only after the 2-week soak (Task 25 Step 5) is clean.** This removes CRA, react-helmet, the puppeteer prerenderer and the CRA entry files, then deploys — so it touches production. Scope discipline: do NOT delete the Mar-13 dead files (Shop/Checkout/etc.) and do NOT remove the Stripe deps — out of scope.

- [ ] **Step 1: Verify nothing still imports what we're about to remove** (verified 2026-07-20; re-verify at execution time)

```bash
grep -rln "react-helmet" src app | grep -v node_modules
grep -rln "react-slick\|slick-carousel" src app
grep -rln "web-vitals\|@testing-library" src app
grep -rln "index\.css\|App\.css" src app
grep -rln "from './App'" src
```

Expected hits, all accounted for:
- react-helmet: `src/App.js` (deleted below), plus three **dead files that stay** with a now-broken import — `src/Makeover.jsx` (unrouted legacy, Mar-13 class), `src/public/SignDocument.jsx`, `src/public/Signed.jsx` (superseded by the `*Client.jsx` ports in Task 15 but kept per scope discipline). Harmless: nothing under `app/` imports them, so Next never compiles them.
- react-slick/slick-carousel: `src/index.js` only (lines 5-6, slick CSS) — deleted below.
- web-vitals/@testing-library: `src/NotFound.test.jsx` + `src/setupTests.js` — deleted below.
- index.css/App.css: `src/index.js` (line 3) — deleted below; `src/App.css` is imported by nothing.
- `from './App'`: `src/index.js` only.

If anything ELSE shows up (a live component still importing react-helmet or slick), **stop** and port that file first.

- [ ] **Step 2: Delete the CRA-era files**

```bash
git rm scripts/prerender.js public/index.html src/index.js src/index.css \
       src/App.js src/App.css src/NotFound.test.jsx src/setupTests.js deploy-cra.sh
```

Expected: 9 `rm` lines. (`src/GlobalStyle.jsx` stays — the root layout uses it. `src/components/TurnstileWidget.jsx` stays orphaned per owner decision.)

- [ ] **Step 3: Remove the dead dependencies (keep `concurrently` — `npm start` still uses it)**

```bash
npm uninstall react-scripts react-helmet puppeteer serve-handler react-slick slick-carousel \
  @testing-library/jest-dom @testing-library/react @testing-library/user-event web-vitals
```

Expected: `removed <N> packages` (large N — react-scripts' tree). `jest` keeps working because Task 4 made it an explicit devDependency.

- [ ] **Step 4: Update package.json scripts.** Exact before → after of the scripts block. The before state is what Tasks 6 (`dev:next`/`build:next`/`start:next`), 13 (`flakes:manifest`), 19 (`test:smoke`) and 20 (`test:node`) left behind; if yours differs slightly, apply the same intent — every react-scripts invocation gone, Next scripts under the primary names:

Before:

```json
"scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "react-scripts start",
    "build": "react-scripts build",
    "postbuild": "node scripts/prerender.js",
    "dev:next": "next dev",
    "build:next": "next build",
    "start:next": "next start",
    "test": "react-scripts test",
    "test:node": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --testMatch \"**/src/admin/**/*.test.js\" --watchAll=false",
    "test:smoke": "playwright test",
    "flakes:manifest": "node scripts/generate-flake-manifest.js",
    "eject": "react-scripts eject"
}
```

After:

```json
"scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "client": "next dev",
    "build": "next build",
    "start:web": "next start",
    "test:node": "jest --rootDir=. --testMatch \"**/{server,scripts}/**/*.test.js\" --testMatch \"**/src/admin/**/*.test.js\" --watchAll=false",
    "test:smoke": "playwright test",
    "flakes:manifest": "node scripts/generate-flake-manifest.js"
}
```

(Changes: `client` → `next dev`, `build` → `next build` — NO postbuild — and `start:web` = `next start`; `postbuild`/`test`/`eject` deleted (all react-scripts); the interim `dev:next`/`build:next`/`start:next` aliases from Task 6 are removed — they existed only so Next and CRA scripts could coexist, and are now exact duplicates of `client`/`build`/`start:web`. `deploy.sh` calls `npx next build` directly, so it is unaffected by any of this. The CRA-only `"proxy"` field near the bottom of package.json served only `react-scripts start` — delete it too, or leave it; it's inert.)

- [ ] **Step 5: Delete `.npmrc` and regenerate the lockfile**

With react-scripts and `@testing-library/*` gone, no `react@^18` peers remain — `legacy-peer-deps` is no longer needed (this fulfills the "Temporary until Task 26" note inside the file itself):

```bash
git rm .npmrc
rm -rf node_modules package-lock.json && npm install
```

Expected: `rm '.npmrc'`; the fresh `npm install` completes with **no ERESOLVE errors** under npm's default peer resolution. This regenerates `package-lock.json` — it is included in this task's commit.

- [ ] **Step 6: Edit `deploy.sh` — drop `.npmrc` from the package-file rsync**

The line currently reads:

```bash
rs package.json package-lock.json .npmrc "$EC2:$REMOTE/"   # .npmrc: legacy-peer-deps for the React 19 bump — EC2 npm install ERESOLVEs without it (Task 26 drops it)
```

Change it (including its trailing comment) to:

```bash
rs package.json package-lock.json "$EC2:$REMOTE/"
```

- [ ] **Step 7: Verify everything is still green**

```bash
npm run test:node
npm run build
npx next start -p 3100 & sleep 3
curl -s http://127.0.0.1:3100/ | grep -o '<title>[^<]*</title>'
kill %1
```

Expected: jest green; `next build` completes with the full route table and no CRA warnings; curl prints the home `<title>…Next Level Epoxy</title>`.

- [ ] **Step 8: Commit**

```bash
git add -A
git add .npmrc deploy.sh package.json package-lock.json
git commit -m "chore(cleanup): remove CRA toolchain post-cutover

react-scripts, react-helmet, puppeteer prerenderer, CRA entry files and
deploy-cra.sh removed after 2-week Next.js soak. build/client scripts now
Next-native. .npmrc deleted (legacy-peer-deps no longer needed) and dropped
from deploy.sh's package-file rsync; lockfile regenerated under default peer
resolution. Stripe deps + Mar-13 dead files deliberately untouched.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(The second `git add` is belt-and-suspenders — `git add -A` already stages the `.npmrc` deletion, the `deploy.sh` edit and the regenerated `package-lock.json`.)

- [ ] **Step 9: Deploy the cleanup** (confirms EC2's shrunken `npm install` and a helmet-free build in prod)

```bash
./deploy.sh
```

Expected: same shape as Task 23 Step 2; EC2 `npm install` removes many packages. Re-run the live parity compare (Task 25 Step 1 command) — expected `exit=0` unchanged.

---

### Task 27: Docs & wrap-up

> ⚠️ **HUMAN CHECKPOINT:** confirm with Bo before running this task.

- [ ] **Step 1: Replace the stock-CRA `README.md` with a real one (complete new content)**

```markdown
# Next Level Epoxy — site + CRM

Marketing site (Next.js App Router, SSR) + CRM/timesheet admin SPA + Express API,
all deployed to a single EC2 box behind nginx.

- Live: https://www.nextlevelepoxynm.com — phone 505-352-4674
- Stack: Next.js (app/ at repo root) + React 19 + styled-components v6;
  Express API in `server/` on :4242; MySQL on-box; PM2 (`nextlevel-web` :3000,
  `nextlevel-api` :4242); nginx proxies `/api/*` → Express, everything else → Next.

## Dev

    npm start          # Express :4242 + next dev :3000 (rewrites proxy /api in dev)
    npm run test:node  # jest: server/**, scripts/**, src/admin/** tests

Gitignored media (public/images/*, public/img/, public/videos/, src/images/,
src/videos/) must exist locally for a faithful build — they live on the laptop
and the box, not in git.

## Build & deploy (laptop-only builds; EC2 never builds)

    npm run build      # next build (output: standalone)
    ./deploy.sh        # build + rsync web/ + server/ to EC2 + PM2 restart + health check

nginx config source of truth: `nginx-default.conf` (repo root) → scp to
`/etc/nginx/sites-enabled/default` per the incident-hardened runbook
(backup to /home/ubuntu/nginx-backups/ → scp → `nginx -t` → reload).

## SEO invariants

- Per-page meta lives ONLY in each `app/**/page.js` `metadata` export
  (single source of truth — do not re-add overridable tags elsewhere).
- Route list / sitemap: `src/routesManifest.js` → `app/sitemap.js` +
  `app/robots.js`. New public pages MUST be added to the manifest
  (this is the phase-2 blog extension point).
- Parity harness: `node scripts/seo-parity.js compare <base> docs/seo-baseline.json
  scripts/seo-parity-allowlist.json` — run against any candidate before shipping
  meta-affecting changes; re-snapshot deliberately when meta changes on purpose.
- Never publish a street address; city/region only.

## Flake catalog

517 Torginol colors on /colors. Images are gitignored but required locally;
regenerate the import manifest after adding images: `npm run flakes:manifest`
(catalog re-scrape: `scripts/fetch-torginol-catalog.py`).
```

- [ ] **Step 2: Verify no stale doc references to the removed tooling**

```bash
grep -rn "react-scripts\|prerender.js" README.md deploy.sh nginx-default.conf || echo CLEAN
```

Expected: `CLEAN` (docs/superpowers/ historical plans/specs are archives — leave them).

- [ ] **Step 3: Update auto-memory** (files under `/Users/boshao/.claude/projects/-Users-boshao-projects-nextlevel/memory/`):
  - `feedback_deploy_process.md` — deploy is now `./deploy.sh` = `next build` (standalone) + rsync `web/`+`server/` + `pm2 startOrRestart nextlevel-web` + `pm2 restart nextlevel-api` + :3000 health check; no more web-root copy.
  - `project_ec2_status.md` — Node 20 LTS, 2GB swapfile, two PM2 apps (`nextlevel-web` 350M cap, `nextlevel-api` 300M cap), nginx proxies everything to :3000 except `/api`, nginx source of truth = repo `nginx-default.conf`, old CRA build removable after soak.
  - `project_nextjs_migration_planned.md` — replace contents with a short "DONE <date>" note pointing to a new `project_nextjs_migration_done.md` (architecture facts: app/ at root, route-group chrome, metadata single-source rule, routesManifest = blog extension point, parity harness usage).
  - Update the `MEMORY.md` index lines accordingly.

- [ ] **Step 4: Commit the docs**

```bash
git add README.md
git commit -m "docs: README for the Next.js era (dev/deploy/SEO invariants)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Finish the branch (superpowers:finishing-a-development-branch).** Verify first, then present Bo the options — do not pick silently:

```bash
npm run test:node && npm run build && echo ALL-GREEN
git log --oneline main..nextjs-migration | head -40
```

Expected: `ALL-GREEN`, then the branch's commit list. Options for Bo: **(a) merge to local main** (repo norm — no remote/PR flow):

```bash
git checkout main
git merge --no-ff nextjs-migration -m "merge: CRA → Next.js migration (nextjs-migration)"
git branch -d nextjs-migration
```

**(b)** keep the branch a while longer (main stays pre-migration; prod already runs the branch build — note deploys must then happen from the branch); or **(c)** discard (not applicable — shipped). Recommend (a): prod has run this code through the soak plus cleanup; main should reflect reality.

- [ ] **Step 6: Wrap-up sanity** — after merge, one last `./deploy.sh` from main is optional but recommended (proves main deploys byte-identically); expected: rsync transfers ~nothing, health check green. Migration complete; phase-2 blog spec can now target `src/routesManifest.js` + ISR.

