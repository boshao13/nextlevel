'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { FiPhone, FiMapPin, FiCheck, FiArrowRight } from 'react-icons/fi';
import ContactForm from './ContactForm';
import { trackPhoneClick } from './lib/analytics';

/* ── Styled ──────────────────────────────────────────────────────── */

const Section = styled.section`
  padding: 120px 24px 80px;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);

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
  color: var(--text-body);
  margin-bottom: 16px;

  a { color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
  a:hover { color: var(--resin-hot); }
  span { color: var(--text-dim); }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--resin);
  font-weight: 700;
  font-size: var(--fs-eyebrow);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const H1 = styled.h1`
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text-hi);
  margin: 0 0 18px;
`;

const Lede = styled.p`
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-body);
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
  background: var(--resin-grad);
  color: #14110a;
  padding: 14px 24px;
  border-radius: 9999px;
  font-weight: 700;
  text-decoration: none;
  transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
  }
`;

const SecondaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(18, 21, 26, 0.35);
  color: var(--text-hi);
  padding: 14px 24px;
  border-radius: 9999px;
  font-weight: 700;
  font-family: inherit;
  font-size: 0.95rem;
  border: 1px solid var(--line-strong);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(240, 165, 0, 0.35);
    background: rgba(255, 255, 255, 0.04);
  }
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
    color: var(--text-hi);
    margin: 32px 0 14px;
    letter-spacing: -0.01em;
  }
  p {
    font-size: 1rem;
    line-height: 1.75;
    color: var(--text-body);
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
    color: var(--text-body);
  }
  li svg {
    flex-shrink: 0;
    color: var(--resin-hot);
    margin-top: 4px;
  }
`;

const InfoCard = styled.aside`
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  padding: 24px;
  box-shadow: var(--shadow-dk-md);
  position: sticky;
  top: 100px;

  @media (max-width: 900px) {
    position: static;
  }
`;

const InfoTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-hi);
  margin: 0 0 14px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.95rem;
  margin-bottom: 12px;
  color: var(--text-body);

  svg { flex-shrink: 0; color: var(--resin-hot); margin-top: 3px; }
`;

const MapWrap = styled.div`
  margin-top: 16px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--line);
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
  border-top: 1px solid var(--line);
`;

const RelatedTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-hi);
  margin: 0 0 16px;
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
`;

const RelatedCard = styled(Link)`
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px 20px;
  text-decoration: none;
  color: var(--text-hi);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(240, 165, 0, 0.35);
    transform: translateY(-3px);
    box-shadow: var(--shadow-dk-md);
  }

  svg { color: var(--resin-hot); }
`;

/* ── Component ────────────────────────────────────────────────────── */

const LocationPage = ({ city }) => {
  // Restore scroll on each route change
  useEffect(() => { window.scrollTo(0, 0); }, [city.slug]);

  return (
    <>
      <Section>
        <Inner>
          <Crumbs>
            <Link href="/">Home</Link> <span>›</span> Epoxy Flooring {city.name}
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
                <a href="tel:5053524674" onClick={() => trackPhoneClick(`location_${city.slug}_card`)} style={{ color: 'var(--resin-hot)', fontWeight: 700, textDecoration: 'none' }}>
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
                <RelatedCard key={r.slug} href={`/${r.slug}`}>
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
