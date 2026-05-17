// City-specific copy for SEO location pages. Keep content unique per city —
// duplicate text across pages hurts ranking.

const ALL = [
  { slug: 'epoxy-flooring-albuquerque', name: 'Albuquerque' },
  { slug: 'epoxy-flooring-santa-fe',   name: 'Santa Fe' },
  { slug: 'epoxy-flooring-rio-rancho', name: 'Rio Rancho' },
];

function relatedFor(slug) {
  return ALL.filter((c) => c.slug !== slug);
}

export const ALBUQUERQUE = {
  slug: 'epoxy-flooring-albuquerque',
  name: 'Albuquerque',
  lede: {
    short: '560+ floors installed across the Duke City.',
    long:
      'From the Heights to the West Side, Albuquerque homeowners and business owners trust Next Level for ' +
      'lifetime-warranty epoxy and polyaspartic floor coatings. We install garage floors, basements, and ' +
      'commercial concrete systems built for New Mexico\'s sun, monsoons, and high-altitude UV.',
  },
  body: {
    intro:
      'Albuquerque has the largest concentration of garages, warehouses, and concrete-floor businesses in ' +
      'New Mexico — and the toughest weather mix anywhere in the state. Hot summers, freeze-thaw winters, ' +
      'and intense UV will eat a cheap coating in two years. Our polyaspartic-topcoat systems are built for ' +
      'exactly this climate and come with a lifetime warranty on indoor concrete we prepare and install.',
    services: [
      'Epoxy and polyaspartic garage floors — full flake broadcast or quartz systems',
      'Commercial concrete coatings for warehouses, auto shops, and retail spaces',
      'Basement floors and indoor patios in custom colors',
      'Concrete prep, crack repair, and moisture mitigation',
      'Same-day or one-day installs available on most residential garages',
    ],
    neighborhoods:
      'We serve all of Albuquerque including the Heights (Northeast and Southeast), the North Valley, ' +
      'Westside neighborhoods like Ventana Ranch and Volterra, downtown, Nob Hill, Four Hills, and the ' +
      'South Valley. We also cover surrounding communities — Corrales, Bosque Farms, Los Lunas, and Bernalillo.',
  },
  related: relatedFor('epoxy-flooring-albuquerque'),
};

export const SANTA_FE = {
  slug: 'epoxy-flooring-santa-fe',
  name: 'Santa Fe',
  lede: {
    short: 'Decorative and durable epoxy for Santa Fe homes and businesses.',
    long:
      'Santa Fe\'s mix of historic adobe homes, modern garages, and commercial spaces calls for floor ' +
      'coatings that look as good as they perform. Our flake-and-polyaspartic systems handle Santa Fe\'s ' +
      'altitude, heavy snow, and gritty winters while complementing high-end interiors.',
  },
  body: {
    intro:
      'Santa Fe sits at over 7,000 feet, which means concrete here goes through more freeze-thaw cycles ' +
      'than almost anywhere we work. Floor coatings in Santa Fe garages need flexible, UV-stable, ' +
      'moisture-tolerant systems — exactly what our polyaspartic topcoats deliver. We work directly with ' +
      'Santa Fe homeowners, builders, and commercial property managers and bring our crews up from ' +
      'Albuquerque on a tight schedule.',
    services: [
      'Custom-color flake and metallic epoxy garage floors',
      'Restaurant kitchen and brewery floor coatings',
      'Workshop, studio, and gallery concrete refinishing',
      'Property-manager service for rental and short-term properties',
      'Heated-garage-compatible systems',
    ],
    neighborhoods:
      'We serve all of Santa Fe — downtown and the historic district, the Eastside, Tesuque, Las Campanas, ' +
      'Eldorado, La Tierra, and Pojoaque. We regularly work in Tesuque Pueblo, Glorieta, and as far north ' +
      'as Española for the right project.',
  },
  related: relatedFor('epoxy-flooring-santa-fe'),
};

export const RIO_RANCHO = {
  slug: 'epoxy-flooring-rio-rancho',
  name: 'Rio Rancho',
  lede: {
    short: 'New homes, big garages, and commercial epoxy across Rio Rancho.',
    long:
      'Rio Rancho is one of the fastest-growing cities in New Mexico — and a huge share of its homes have ' +
      'three-car garages and finished basements waiting for the right floor. Our crews are in Rio Rancho ' +
      'every week installing lifetime-warranty epoxy and polyaspartic systems for new construction and ' +
      'remodels alike.',
  },
  body: {
    intro:
      'Rio Rancho\'s newer construction means cleaner concrete substrates and shorter prep times — which ' +
      'means we can usually quote, schedule, and install a residential garage in under two weeks. For ' +
      'commercial and industrial properties around Intel, Hewlett Packard, and the Cabezon corridor, ' +
      'we install heavy-duty quartz-broadcast and polyaspartic systems engineered for forklifts, hot ' +
      'tires, and chemical exposure.',
    services: [
      'Three-car and oversized residential garage epoxy floors',
      'New-construction polyaspartic systems coordinated with builders',
      'Commercial floors for tech, manufacturing, and retail',
      'Multi-bay automotive shop coatings',
      'HOA and townhome cluster pricing',
    ],
    neighborhoods:
      'We serve all Rio Rancho neighborhoods including Cabezon, Mariposa, Enchanted Hills, Loma Colorado, ' +
      'Northern Meadows, and Vista Hills. We also cover Corrales, Placitas, Bernalillo, and the ' +
      'I-25 corridor up to Algodones.',
  },
  related: relatedFor('epoxy-flooring-rio-rancho'),
};
