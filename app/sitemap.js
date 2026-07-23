// app/sitemap.js — serves /sitemap.xml, generated from src/routesManifest.js.
// Replaces the hand-maintained public/sitemap.xml (deleted in this commit).
import manifest from '../src/routesManifest';

export default function sitemap() {
  return manifest.sitemapEntries();
}
