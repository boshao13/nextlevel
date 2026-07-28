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
  { path: '/epoxy-flooring-albuquerque', sitemap: true, lastmod: '2026-07-27' },
  { path: '/epoxy-flooring-santa-fe', sitemap: true, lastmod: '2026-07-27' },
  { path: '/epoxy-flooring-rio-rancho', sitemap: true, lastmod: '2026-07-27' },
  { path: '/commercial', sitemap: true, lastmod: '2026-05-13' },
  { path: '/garagemakeover', sitemap: true, lastmod: '2026-05-14' },
  { path: '/patios', sitemap: true, lastmod: '2026-05-14' },
  { path: '/colors', sitemap: true, lastmod: '2026-05-13' },
  { path: '/radon', sitemap: true, lastmod: '2026-05-13' },
  { path: '/polished-concrete', sitemap: true, lastmod: '2026-07-27' },
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
