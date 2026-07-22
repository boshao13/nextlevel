import Hero from '../../src/Hero';
import EpoxyInfo from '../../src/EpoxyInfo';
import Warranty from '../../src/Warranty';
import FlakeCarousel from '../../src/FlakeCarousel';
import Gallery from '../../src/Gallery';
import Testimonials from '../../src/Testimonials';
import ContactForm from '../../src/ContactForm';
import { PourDivider, ResinSwirl } from '../../src/accents';
import { pageMetadata, SITE, TWITTER_DEFAULTS } from '../../src/seo';

const home = pageMetadata({
  title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy',
  description: 'Epoxy flooring in Albuquerque, Santa Fe & Rio Rancho NM. Lifetime garage floors & concrete coatings. 560+ installed. Free quote: 505-352-4674.',
  ogDescription: 'Lifetime-warranty epoxy garage floors & concrete coatings in Albuquerque, Santa Fe & Rio Rancho NM. 560+ floors installed. Free quote: 505-352-4674.',
  path: '/',
});

export const metadata = {
  ...home,
  // Trailing-slash byte parity: prod's root canonical/og:url are
  // 'https://www.nextlevelepoxynm.com/' (WITH slash). When a metadataBase is
  // in scope, Next's resolver serializes any root-path URL as `origin`
  // (slash stripped — resolve-url.js resolveAbsoluteUrlWithPathname), even
  // for absolute strings or URL instances. Nulling metadataBase here makes
  // the resolver pass absolute STRINGS through verbatim. Home-page-only;
  // safe because every URL in this page's metadata is already absolute
  // (src/seo.js SITE-prefixed) — keep it that way. Verified: full-head diff
  // shows exactly these two tags changing. If a Next upgrade breaks this,
  // the Task 18 parity gate will catch it.
  metadataBase: null,
  alternates: { canonical: `${SITE}/` },
  openGraph: { ...home.openGraph, url: `${SITE}/` },
  // Home is the ONLY page with its own twitter:title/description (see
  // helmet-meta extraction). `twitter` is shallow-replaced, so the
  // site-wide card + image must be re-stated here.
  twitter: {
    ...TWITTER_DEFAULTS,
    title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level',
    description: 'Lifetime-warranty epoxy garage floors & concrete coatings across New Mexico. 560+ floors installed. Free quote: 505-352-4674.',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PourDivider style={{ background: 'var(--bg0)' }} />
      <EpoxyInfo />
      <Warranty />
      <ResinSwirl style={{ background: 'var(--bg0)' }} />
      <FlakeCarousel />
      <Gallery />
      <Testimonials />
      <ContactForm />
    </>
  );
}
