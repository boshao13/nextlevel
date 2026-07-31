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
  '/accessibility',
  '/epoxy-flooring-albuquerque',
  '/epoxy-flooring-santa-fe',
  '/epoxy-flooring-rio-rancho',
  // /blog is ISR (revalidate 3600) — still present in prerender-manifest
  // routes. /blog/[slug] is deliberately ABSENT: generateStaticParams() is []
  // (build box has no DB), posts render on demand at runtime.
  '/blog',
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
