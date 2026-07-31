// scripts/routes-manifest.test.js
// Guards the manifest → sitemap mapping. EXPECTED mirrors src/routesManifest.js
// deliberately (originally a byte-for-byte copy of the retired hand-maintained
// public/sitemap.xml; lastmods have since been bumped by the 2026-07-27 SEO
// pass and /blog added by the blog launch). If you add a public route, add it
// to src/routesManifest.js AND extend this list deliberately.
const { routes, sitemapEntries, blogSitemapEntries } = require('../src/routesManifest');

const EXPECTED = [
  ['https://www.nextlevelepoxynm.com/', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/epoxy-flooring-albuquerque', '2026-07-27'],
  ['https://www.nextlevelepoxynm.com/epoxy-flooring-santa-fe', '2026-07-27'],
  ['https://www.nextlevelepoxynm.com/epoxy-flooring-rio-rancho', '2026-07-27'],
  ['https://www.nextlevelepoxynm.com/commercial', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/garagemakeover', '2026-05-14'],
  ['https://www.nextlevelepoxynm.com/patios', '2026-05-14'],
  ['https://www.nextlevelepoxynm.com/colors', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/radon', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/polished-concrete', '2026-07-27'],
  ['https://www.nextlevelepoxynm.com/careers', '2026-05-13'],
  ['https://www.nextlevelepoxynm.com/privacy', '2026-06-11'],
  ['https://www.nextlevelepoxynm.com/terms', '2026-06-11'],
  ['https://www.nextlevelepoxynm.com/accessibility', '2026-07-30'],
  ['https://www.nextlevelepoxynm.com/blog', '2026-07-27'],
];

describe('routesManifest', () => {
  test('sitemap entries reproduce the manifest URLs in order, exact lastmod', () => {
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

// Dynamic blog hook — fetch is stubbed so the tests never depend on a live
// Express API (a running local dev server would otherwise make them flaky).
describe('blogSitemapEntries', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  test('maps API posts to /blog/<slug> rows with YYYY-MM-DD lastmod', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { slug: 'epoxy-cost-albuquerque', published_at: '2026-07-27T12:00:00.000Z' },
        { slug: 'epoxy-vs-polyaspartic', published_at: '2026-07-27T12:00:00.000Z' },
      ],
    });
    expect(await blogSitemapEntries()).toEqual([
      { url: 'https://www.nextlevelepoxynm.com/blog/epoxy-cost-albuquerque', lastModified: '2026-07-27' },
      { url: 'https://www.nextlevelepoxynm.com/blog/epoxy-vs-polyaspartic', lastModified: '2026-07-27' },
    ]);
  });

  test('returns [] when the API is down, non-200, or returns junk', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await blogSitemapEntries()).toEqual([]);

    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    expect(await blogSitemapEntries()).toEqual([]);

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ nope: true }) });
    expect(await blogSitemapEntries()).toEqual([]);
  });
});
