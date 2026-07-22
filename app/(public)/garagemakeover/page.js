import GarageMakeover from '../../../src/GarageMakeover';
import { pageMetadata } from '../../../src/seo';
import { jsonLdString } from '../../../src/structuredData';

export const metadata = {
  ...pageMetadata({
    title: 'Garage Makeover Albuquerque & Santa Fe NM | Next Level Epoxy',
    description: 'Garage makeover in Albuquerque & Santa Fe, NM: epoxy flooring, polyaspartic coatings, lighting, wall paint, baseboards. Lifetime warranty. Free quote.',
    ogTitle: 'Complete Garage Makeover | Epoxy & Polyaspartic Floor Coatings | Albuquerque & Santa Fe NM',
    ogDescription: 'Transform your garage with professional epoxy flooring, polyaspartic coatings, custom lighting & wall finishing. Lifetime warranty. Serving Albuquerque & Santa Fe, NM.',
    path: '/garagemakeover',
  }),
  keywords: 'garage makeover Albuquerque, epoxy garage floor Albuquerque, polyaspartic floor coating Santa Fe, garage floor coating near me, epoxy flooring near me, concrete floor coating New Mexico, garage renovation Albuquerque, metallic epoxy flooring, flake epoxy garage floor, one day garage floor coating, residential epoxy flooring, commercial epoxy flooring, garage transformation, epoxy flooring cost, best garage floor coating',
};

// Moved verbatim from the old <SEO> Helmet block in src/GarageMakeover.jsx
// (only the transport changed: react-helmet → server-rendered script tag).
const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Complete Garage Makeover Package',
  description: 'Professional garage makeover including epoxy flooring, polyaspartic floor coatings, wall painting, baseboard installation, and custom lighting in Albuquerque and Santa Fe, New Mexico.',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Next Level Epoxy Flooring',
    url: 'https://www.nextlevelepoxynm.com',
    telephone: '+1-505-352-4674',
    areaServed: [
      { '@type': 'City', name: 'Albuquerque', addressRegion: 'NM' },
      { '@type': 'City', name: 'Santa Fe', addressRegion: 'NM' },
      { '@type': 'City', name: 'Rio Rancho', addressRegion: 'NM' },
      { '@type': 'City', name: 'Los Lunas', addressRegion: 'NM' },
    ],
    priceRange: '$$',
  },
  serviceType: ['Epoxy Flooring', 'Polyaspartic Floor Coating', 'Garage Makeover', 'Concrete Floor Coating', 'Garage Floor Coating'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Garage Makeover Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Epoxy Garage Floor Coating' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Polyaspartic Garage Floor Coating' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Metallic Epoxy Flooring' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Decorative Flake Floor Coating' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Garage Wall Painting & Baseboards' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom Garage Lighting Installation' } },
    ],
  },
};

export default function GarageMakeoverPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(SCHEMA) }} />
      <GarageMakeover />
    </>
  );
}
