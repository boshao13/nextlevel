/**
 * Site-wide LocalBusiness + Service JSON-LD @graph (public/index.html:42-105),
 * rendered once in app/layout.js. The `#business` @id is referenced by the
 * location pages' Service schemas. POLICY: never add a street address.
 * JSON.stringify emits minified JSON vs. index.html's pretty-printed script —
 * the parity harness compares PARSED JSON-LD, so that is a non-diff.
 */
export const BUSINESS_GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://www.nextlevelepoxynm.com/#business',
      name: 'Next Level Epoxy Flooring',
      image: 'https://www.nextlevelepoxynm.com/nextlevellogo.png',
      logo: 'https://www.nextlevelepoxynm.com/nextlevellogo.png',
      url: 'https://www.nextlevelepoxynm.com',
      telephone: '+1-505-352-4674',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Albuquerque',
        addressRegion: 'NM',
        addressCountry: 'US',
      },
      areaServed: [
        { '@type': 'City', name: 'Albuquerque', containedInPlace: { '@type': 'State', name: 'New Mexico' } },
        { '@type': 'City', name: 'Santa Fe', containedInPlace: { '@type': 'State', name: 'New Mexico' } },
        { '@type': 'City', name: 'Rio Rancho', containedInPlace: { '@type': 'State', name: 'New Mexico' } },
      ],
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '16:00' },
      ],
      sameAs: ['https://www.instagram.com/nextlevelepoxynm'],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '47',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'Service',
      serviceType: 'Epoxy Garage Floor Coating',
      provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
      areaServed: ['Albuquerque, NM', 'Santa Fe, NM', 'Rio Rancho, NM'],
      url: 'https://www.nextlevelepoxynm.com/garagemakeover',
      description: 'Lifetime-warranty epoxy garage floor coatings installed in as little as one day. Custom colors, flake systems, polyaspartic topcoats.',
    },
    {
      '@type': 'Service',
      serviceType: 'Commercial Concrete Coatings',
      provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
      areaServed: ['Albuquerque, NM', 'Santa Fe, NM', 'Rio Rancho, NM'],
      url: 'https://www.nextlevelepoxynm.com/commercial',
      description: 'Heavy-duty commercial epoxy and polyaspartic floor systems for warehouses, restaurants, automotive shops, and industrial facilities.',
    },
    {
      '@type': 'Service',
      serviceType: 'Residential Epoxy Flooring',
      provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
      areaServed: ['Albuquerque, NM', 'Santa Fe, NM', 'Rio Rancho, NM'],
      url: 'https://www.nextlevelepoxynm.com/',
      description: 'Decorative epoxy and polyaspartic floors for garages, basements, and patios. Indoor concrete substrates only; lifetime warranty on Next Level installs.',
    },
  ],
};
