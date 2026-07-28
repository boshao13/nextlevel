// Server-side SEO builders for the three /epoxy-flooring-* pages.
// Title/description templates and the @graph schema are verbatim from the
// old LocationPage.jsx Helmet block — keep strings byte-identical.
import { pageMetadata, SITE } from './seo';

export function locationMetadata(city) {
  return pageMetadata({
    title: `Epoxy Flooring ${city.name}, NM | Garage & Concrete Coatings`,
    description: `Lifetime-warranty epoxy floors & coatings in ${city.name}, NM. ${city.lede.short} Free quote: 505-352-4674.`,
    path: `/${city.slug}`,
  });
}

// Page-specific JSON-LD: a Service offered in this city, plus a BreadcrumbList.
// provider references the site-wide LocalBusiness @id rendered by the root
// layout's BUSINESS_GRAPH (…/#business) — do not inline a second business.
export function locationSchema(city) {
  const url = `${SITE}/${city.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        serviceType: `Epoxy Flooring in ${city.name}, NM`,
        provider: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
        areaServed: {
          '@type': 'City',
          name: city.name,
          containedInPlace: { '@type': 'State', name: 'New Mexico' },
        },
        url,
        description: `Epoxy garage floors, polyaspartic coatings, and commercial concrete floor systems for ${city.name}, NM. Lifetime-warranty installs.`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nextlevelepoxynm.com/' },
          { '@type': 'ListItem', position: 2, name: `${city.name} Epoxy Flooring`, item: url },
        ],
      },
      // FAQPage mirrors the visible FAQ section on the page (rich-result
      // eligible; questions must stay in sync with city.faqs — they are
      // generated from the same data, so they always do).
      ...(city.faqs?.length
        ? [{
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: city.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  };
}
