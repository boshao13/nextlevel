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
// PHASE-2 (2026-07-27): the SEO blog's /blog/<slug> entries are DYNAMIC —
// blogSitemapEntries() below fetches them from the Express API at render
// time and app/sitemap.js merges them after the static rows.

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
  { path: '/accessibility', sitemap: true, lastmod: '2026-07-30' },
  { path: '/blog', sitemap: true, lastmod: '2026-07-27' },
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

// PHASE-2 dynamic hook: blog posts live in MySQL behind the Express API, so
// their sitemap rows are fetched at render time (app/sitemap.js is ISR,
// revalidate 3600). MUST return [] on ANY failure — the build box has no DB
// and no :4242 API, and a build must still pass with just the static rows.
const BLOG_API = 'http://127.0.0.1:4242/api/blog';

async function blogSitemapEntries() {
  try {
    const res = await fetch(BLOG_API, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const posts = await res.json();
    if (!Array.isArray(posts)) return [];
    return posts
      .filter((p) => p && typeof p.slug === 'string' && p.slug)
      .map((p) => ({
        url: `${SITE}/blog/${p.slug}`,
        // published_at (MySQL DATETIME → ISO string in JSON) trimmed to
        // YYYY-MM-DD to match the plain-date <lastmod> style of the static rows.
        lastModified: String(p.published_at || '').slice(0, 10) || undefined,
      }));
  } catch (err) {
    // API down (local build, Express restart) — sitemap ships static rows only.
    return [];
  }
}

module.exports = { SITE, routes, sitemapEntries, blogSitemapEntries };
