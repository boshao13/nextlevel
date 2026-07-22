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
