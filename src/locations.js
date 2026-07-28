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
      'exactly this climate and come with a lifetime warranty on indoor concrete we prepare and install. ' +
      'Whether you\'re comparing garage floor coatings for a two-car garage in the Heights or spec\'ing ' +
      'floor coatings for a warehouse off I-25, you\'ll deal directly with the crew that does the work — ' +
      'we\'re an Albuquerque epoxy company, not a national franchise, and most residential garage floors ' +
      'are installed in a single day.',
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
  faqs: [
    {
      q: 'How much does epoxy flooring cost in Albuquerque?',
      a: 'It depends on the square footage, the condition of your concrete, and the system you choose — a standard two-car garage with flake broadcast is priced very differently from a commercial urethane-cement floor. Every quote starts with a free on-site visit anywhere in Albuquerque, so you get a real number for your actual floor, not a guess. Call 505-352-4674 or use the quote form and we\'ll come take a look.',
    },
    {
      q: 'How long does an epoxy garage floor take to install?',
      a: 'Most residential garage floors in Albuquerque are installed in a single day: we grind and prep the concrete, repair cracks, broadcast your flake color, and lock it down with a polyaspartic topcoat. Larger or moisture-compromised floors can take longer — we\'ll tell you exactly what to expect at the estimate.',
    },
    {
      q: 'Will an epoxy floor survive Albuquerque\'s sun and freeze-thaw winters?',
      a: 'That\'s exactly what our systems are built for. High-desert UV and freeze-thaw cycles destroy cheap coatings in a couple of years; we use UV-stable polyaspartic topcoats over properly ground concrete, and back indoor floors we prepare and install with a lifetime warranty.',
    },
    {
      q: 'Do you handle commercial floors as well as garages?',
      a: 'Yes — warehouses, auto shops, restaurants, and retail spaces across Albuquerque. Quartz sand broadcast, decorative flake, urethane cement, metallic epoxy, self-leveling, and polyaspartic systems, installed by our own in-house crews.',
    },
  ],
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
  faqs: [
    {
      q: 'Do you actually work in Santa Fe, or just Albuquerque?',
      a: 'We install in Santa Fe every week — our crews come up from Albuquerque on a tight schedule, and there\'s no travel charge for Santa Fe proper. Downtown, the Eastside, Las Campanas, Eldorado, Tesuque, and out to Glorieta and Española for the right project.',
    },
    {
      q: 'Can epoxy handle Santa Fe\'s altitude and snow?',
      a: 'Santa Fe sits above 7,000 feet and sees more freeze-thaw cycles than almost anywhere we work. Rigid budget epoxies crack under that movement; our flexible, UV-stable polyaspartic topcoat systems are engineered for it, and indoor floors we prepare and install carry a lifetime warranty.',
    },
    {
      q: 'How long does a Santa Fe garage floor install take?',
      a: 'Most residential garages are a one-day install — prep and grinding in the morning, flake and topcoat by the afternoon. Heated garages and larger commercial floors are scheduled case by case, and we\'ll give you the exact timeline with your free quote.',
    },
  ],
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
  faqs: [
    {
      q: 'My Rio Rancho house is new construction — when can the garage be coated?',
      a: 'New concrete needs to cure before it can be coated — typically about 28 days. If you\'re closing on a new build in Cabezon, Mariposa, or Loma Colorado, get on our schedule now and we\'ll coat the garage as soon as the slab is ready. It\'s far easier before the boxes move in.',
    },
    {
      q: 'How long does an epoxy garage floor take in Rio Rancho?',
      a: 'Most residential garages — including the oversized three-car garages common in newer Rio Rancho builds — are installed in a single day with our flake-and-polyaspartic system, backed by a lifetime warranty on indoor concrete we prepare and install.',
    },
    {
      q: 'What does a garage floor coating cost in Rio Rancho?',
      a: 'Pricing depends on square footage, concrete condition, and the system you pick, so we quote from a free on-site visit anywhere in Rio Rancho — no travel charge. Call 505-352-4674 or send the quote form and we\'ll take a look.',
    },
  ],
};
