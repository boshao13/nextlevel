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
