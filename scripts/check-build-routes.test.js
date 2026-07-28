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
  test('covers the 16 public pages plus sitemap.xml and robots.txt', () => {
    expect(EXPECTED_STATIC).toHaveLength(18);
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
        '/blog',
        '/sitemap.xml',
        '/robots.txt',
      ])
    );
  });

  test('deliberately excludes /404 (literal URL now returns real HTTP 404) and dynamic routes', () => {
    expect(EXPECTED_STATIC).not.toContain('/404');
    expect(EXPECTED_STATIC.some((r) => r.startsWith('/admin'))).toBe(false);
    expect(EXPECTED_STATIC.some((r) => r.startsWith('/sign'))).toBe(false);
    // Blog posts are runtime-ISR (empty generateStaticParams) — never expected static.
    expect(EXPECTED_STATIC.some((r) => r.startsWith('/blog/'))).toBe(false);
  });
});
