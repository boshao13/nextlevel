import Patios from '../../../src/Patios';
import { pageMetadata } from '../../../src/seo';
import { jsonLdString } from '../../../src/structuredData';

export const metadata = {
  ...pageMetadata({
    title: 'Epoxy Patio Coatings Albuquerque, Santa Fe & Rio Rancho NM | Next Level',
    description: "UV-resistant epoxy patio coatings in Albuquerque, Santa Fe & Rio Rancho NM. Won't fade in NM sun. Stain-proof, slip-safe, lifetime warranty. Free quote: 505-352-4674.",
    ogDescription: "UV-stable polyaspartic patio coatings that don't fade, stain, or crack in the NM sun. Lifetime warranty. Free quote.",
    path: '/patios',
  }),
  keywords: 'epoxy patio Albuquerque, patio coating Santa Fe, UV resistant patio flooring Rio Rancho, outdoor concrete coating New Mexico, polyaspartic patio floor, patio resurfacing Albuquerque, backyard concrete coating, pool deck epoxy NM, concrete patio refinishing',
};

// Moved verbatim from the old <SEO> Helmet block in src/Patios.jsx.
const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Epoxy & Polyaspartic Patio Coatings',
  serviceType: ['Patio Coating', 'Outdoor Concrete Coating', 'UV-Resistant Floor Coating'],
  description: "UV-stable polyaspartic patio coatings for outdoor concrete in Albuquerque, Santa Fe, and Rio Rancho, New Mexico. Won't fade, stain, or crack. Lifetime warranty on prepared concrete.",
  provider: {
    '@type': 'LocalBusiness',
    name: 'Next Level Epoxy Flooring',
    url: 'https://www.nextlevelepoxynm.com',
    telephone: '+1-505-352-4674',
    areaServed: [
      { '@type': 'City', name: 'Albuquerque', addressRegion: 'NM' },
      { '@type': 'City', name: 'Santa Fe', addressRegion: 'NM' },
      { '@type': 'City', name: 'Rio Rancho', addressRegion: 'NM' },
    ],
    priceRange: '$$',
  },
};

export default function PatiosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(SCHEMA) }} />
      <Patios />
    </>
  );
}
