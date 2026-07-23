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
