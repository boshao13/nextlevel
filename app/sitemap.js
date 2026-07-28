// app/sitemap.js — serves /sitemap.xml, generated from src/routesManifest.js.
// Replaces the hand-maintained public/sitemap.xml (deleted in this commit).
//
// ISR (revalidate 3600): the static rows are compile-time constants, but the
// blog rows come from the Express API at render time. At build the API is
// absent → blogSitemapEntries() returns [] and the sitemap ships static-only,
// then picks up the blog slugs on first revalidation in prod.
import manifest from '../src/routesManifest';

export const revalidate = 3600;

export default async function sitemap() {
  return [...manifest.sitemapEntries(), ...(await manifest.blogSitemapEntries())];
}
