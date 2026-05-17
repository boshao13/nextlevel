import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { FiPhone, FiMapPin, FiCheck, FiArrowRight } from 'react-icons/fi';
import ContactForm from './ContactForm';
import { trackPhoneClick } from './lib/analytics';

/* ── Styled ──────────────────────────────────────────────────────── */

const Section = styled.section`
  padding: 120px 24px 80px;
  background: linear-gradient(180deg, #f5f8fc 0%, #ffffff 100%);

  @media (max-width: 768px) {
    padding: 100px 16px 60px;
  }
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Crumbs = styled.nav`
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 16px;

  a { color: #888; text-decoration: none; }
  a:hover { color: var(--primary); }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 76, 129, 0.08);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 20px;
  margin-bottom: 16px;
`;

const H1 = styled.h1`
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text);
  margin: 0 0 18px;
`;

const Lede = styled.p`
  font-size: 1.1rem;
  line-height: 1.7;
  color: #444;
  max-width: 720px;
  margin: 0 0 28px;
`;

const CtaRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 48px;
`;

const PrimaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--primary);
  color: white;
  padding: 14px 24px;
  border-radius: 9999px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s, transform 0.1s;

  &:hover { background: var(--primary-dark); transform: translateY(-1px); }
`;

const SecondaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: var(--primary);
  padding: 14px 24px;
  border-radius: 9999px;
  font-weight: 700;
  font-family: inherit;
  font-size: 0.95rem;
  border: 2px solid var(--primary);
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba(15, 76, 129, 0.06); }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 48px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const Body = styled.div`
  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text);
    margin: 32px 0 14px;
    letter-spacing: -0.01em;
  }
  p {
    font-size: 1rem;
    line-height: 1.75;
    color: #444;
    margin: 0 0 16px;
  }
  ul {
    margin: 0 0 20px;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 1rem;
    color: #333;
  }
  li svg {
    flex-shrink: 0;
    color: var(--primary);
    margin-top: 4px;
  }
`;

const InfoCard = styled.aside`
  background: white;
  border: 1px solid #eef2f6;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04), 0 12px 36px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 100px;

  @media (max-width: 900px) {
    position: static;
  }
`;

const InfoTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 14px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.95rem;
  margin-bottom: 12px;
  color: #444;

  svg { flex-shrink: 0; color: var(--primary); margin-top: 3px; }
`;

const MapWrap = styled.div`
  margin-top: 16px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #eef2f6;
`;

const MapIframe = styled.iframe`
  width: 100%;
  height: 220px;
  border: 0;
  display: block;
`;

const RelatedRow = styled.div`
  margin-top: 56px;
  padding-top: 32px;
  border-top: 1px solid #eef2f6;
`;

const RelatedTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 16px;
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
`;

const RelatedCard = styled(Link)`
  background: white;
  border: 1px solid #eef2f6;
  border-radius: 12px;
  padding: 18px 20px;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s, transform 0.1s;

  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }

  svg { color: var(--primary); }
`;

/* ── Component ────────────────────────────────────────────────────── */

const LocationPage = ({ city }) => {
  // Restore scroll on each route change
  useEffect(() => { window.scrollTo(0, 0); }, [city.slug]);

  const url = `https://www.nextlevelepoxynm.com/${city.slug}`;
  const title = `Epoxy Flooring ${city.name}, NM | Garage & Concrete Coatings`;
  const description = `Lifetime-warranty epoxy floors & coatings in ${city.name}, NM. ${city.lede.short} Free quote: 505-352-4674.`;

  // Page-specific JSON-LD: a Service offered in this city, plus a BreadcrumbList.
  const schema = {
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
          containedInPlace: { '@type': 'State', name: 'New Mexico' }
        },
        url,
        description: `Epoxy garage floors, polyaspartic coatings, and commercial concrete floor systems for ${city.name}, NM. Lifetime-warranty installs.`
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.nextlevelepoxynm.com/' },
          { '@type': 'ListItem', position: 2, name: `${city.name} Epoxy Flooring`, item: url }
        ]
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <Section>
        <Inner>
          <Crumbs>
            <Link to="/">Home</Link> <span>›</span> Epoxy Flooring {city.name}
          </Crumbs>

          <Eyebrow>
            <FiMapPin size={12} />
            Serving {city.name}, NM
          </Eyebrow>

          <H1>Epoxy Flooring {city.name}, NM</H1>

          <Lede>{city.lede.long}</Lede>

          <CtaRow>
            <PrimaryBtn
              href="tel:5053524674"
              onClick={() => trackPhoneClick(`location_${city.slug}`)}
            >
              <FiPhone size={16} />
              Call 505-352-4674
            </PrimaryBtn>
            <SecondaryBtn onClick={() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              Free Quote
              <FiArrowRight size={16} />
            </SecondaryBtn>
          </CtaRow>

          <Grid>
            <Body>
              <h2>Concrete Coatings Built for {city.name}</h2>
              <p>{city.body.intro}</p>

              <h2>What We Install</h2>
              <ul>
                {city.body.services.map((s, i) => (
                  <li key={i}><FiCheck size={18} /> <span>{s}</span></li>
                ))}
              </ul>

              <h2>Areas We Serve in {city.name}</h2>
              <p>{city.body.neighborhoods}</p>

              <h2>Why Homeowners &amp; Businesses Choose Next Level</h2>
              <ul>
                <li><FiCheck size={18} /> <span>Lifetime warranty on indoor concrete floors we prepare and install</span></li>
                <li><FiCheck size={18} /> <span>560+ floors installed across New Mexico — references on request</span></li>
                <li><FiCheck size={18} /> <span>In-house crews — no subcontractors, no surprises</span></li>
                <li><FiCheck size={18} /> <span>Polyaspartic and epoxy systems, USA-made products</span></li>
                <li><FiCheck size={18} /> <span>Free on-site estimates throughout {city.name}</span></li>
              </ul>
            </Body>

            <InfoCard>
              <InfoTitle>Get a Free {city.name} Quote</InfoTitle>
              <InfoRow>
                <FiPhone size={16} />
                <a href="tel:5053524674" onClick={() => trackPhoneClick(`location_${city.slug}_card`)} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                  505-352-4674
                </a>
              </InfoRow>
              <InfoRow>
                <FiMapPin size={16} />
                <span>Serving all of {city.name} and surrounding NM communities. Free estimates Monday–Saturday.</span>
              </InfoRow>
              <MapWrap>
                <MapIframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(city.name + ', NM')}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${city.name}, NM map`}
                />
              </MapWrap>
            </InfoCard>
          </Grid>

          <RelatedRow>
            <RelatedTitle>Also serving</RelatedTitle>
            <RelatedGrid>
              {city.related.map((r) => (
                <RelatedCard key={r.slug} to={`/${r.slug}`}>
                  <span>Epoxy Flooring {r.name}</span>
                  <FiArrowRight size={16} />
                </RelatedCard>
              ))}
            </RelatedGrid>
          </RelatedRow>
        </Inner>
      </Section>

      <ContactForm />
    </>
  );
};

export default LocationPage;
