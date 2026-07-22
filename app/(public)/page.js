import Hero from '../../src/Hero';
import EpoxyInfo from '../../src/EpoxyInfo';
import Warranty from '../../src/Warranty';
import FlakeCarousel from '../../src/FlakeCarousel';
import Gallery from '../../src/Gallery';
import Testimonials from '../../src/Testimonials';
import ContactForm from '../../src/ContactForm';
import { PourDivider, ResinSwirl } from '../../src/accents';
import { pageMetadata } from '../../src/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy',
    description: 'Epoxy flooring in Albuquerque, Santa Fe & Rio Rancho NM. Lifetime garage floors & concrete coatings. 560+ installed. Free quote: 505-352-4674.',
    ogDescription: 'Lifetime-warranty epoxy garage floors & concrete coatings in Albuquerque, Santa Fe & Rio Rancho NM. 560+ floors installed. Free quote: 505-352-4674.',
    path: '/',
  }),
  // Home is the ONLY page with its own twitter:title/description (see
  // helmet-meta extraction). `twitter` is shallow-replaced, so the
  // site-wide card + image must be re-stated here.
  twitter: {
    card: 'summary_large_image',
    title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level',
    description: 'Lifetime-warranty epoxy garage floors & concrete coatings across New Mexico. 560+ floors installed. Free quote: 505-352-4674.',
    images: ['https://www.nextlevelepoxynm.com/images/twitter-image.jpg'],
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
