// src/Patios.jsx — UV-resistant epoxy patio coatings
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import ContactForm from './ContactForm';

const SEO = () => (
  <Helmet>
    <title>Epoxy Patio Coatings Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level</title>
    <meta name="description" content="UV-resistant epoxy patio coatings in Albuquerque, Santa Fe & Rio Rancho NM. Won't fade in NM sun. Stain-proof, slip-safe, lifetime warranty. Free quote: 505-352-4674." />
    <meta name="keywords" content="epoxy patio Albuquerque, patio coating Santa Fe, UV resistant patio flooring Rio Rancho, outdoor concrete coating New Mexico, polyaspartic patio floor, patio resurfacing Albuquerque, backyard concrete coating, pool deck epoxy NM, concrete patio refinishing" />
    <link rel="canonical" href="https://www.nextlevelepoxynm.com/patios" />
    <meta property="og:title" content="Epoxy Patio Coatings Albuquerque, Santa Fe & Rio Rancho NM | Next Level" />
    <meta property="og:description" content="UV-stable polyaspartic patio coatings that don't fade, stain, or crack in the NM sun. Lifetime warranty. Free quote." />
    <meta property="og:url" content="https://www.nextlevelepoxynm.com/patios" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg" />
    <script type="application/ld+json">{`
      {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Epoxy & Polyaspartic Patio Coatings",
        "serviceType": ["Patio Coating", "Outdoor Concrete Coating", "UV-Resistant Floor Coating"],
        "description": "UV-stable polyaspartic patio coatings for outdoor concrete in Albuquerque, Santa Fe, and Rio Rancho, New Mexico. Won't fade, stain, or crack. Lifetime warranty on prepared concrete.",
        "provider": {
          "@type": "LocalBusiness",
          "name": "Next Level Epoxy Flooring",
          "url": "https://www.nextlevelepoxynm.com",
          "telephone": "+1-505-352-4674",
          "areaServed": [
            { "@type": "City", "name": "Albuquerque", "addressRegion": "NM" },
            { "@type": "City", "name": "Santa Fe",   "addressRegion": "NM" },
            { "@type": "City", "name": "Rio Rancho", "addressRegion": "NM" }
          ],
          "priceRange": "$$"
        }
      }
    `}</script>
  </Helmet>
);

/* ── UV+ flake catalog (Torginol UV+ line) ─────────────────────────── */
const uvFlakeContext = require.context('./images/uv-flakes', false, /\.jpg$/);
const STANDARD_NAMES = new Set([
  'veranda','courtyard','chalet','saltbox','rooftop','homestead','cottage',
  'townhome','villa','pueblo','beach-house','loft','ranch','bower','chateau',
  'midcentury','bungalow','manor','ironwork','rowhouse','castle','terrace',
  'tudor','brownstone',
]);

const allUvFlakes = uvFlakeContext.keys().map((key) => {
  const filename = key.replace('./', '').replace('.jpg', '');
  const name = filename
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    name,
    filename,
    img: uvFlakeContext(key),
    kind: STANDARD_NAMES.has(filename) ? 'standard' : 'hybrid',
  };
}).sort((a, b) => a.name.localeCompare(b.name));

const standardFlakes = allUvFlakes.filter((f) => f.kind === 'standard');
const hybridFlakes   = allUvFlakes.filter((f) => f.kind === 'hybrid');

const MOBILE_MQ = '(max-width: 768px)';

/* ── Styled Components ────────────────────────────────────────────── */
const PageContainer = styled.div`
  overflow-x: hidden;
  width: 100%;
`;

const Hero = styled.section`
  position: relative;
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 140px 24px 80px;
  text-align: center;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(255, 196, 100, 0.25) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 70%, rgba(220, 120, 70, 0.22) 0%, transparent 55%),
    linear-gradient(160deg, #0f4c81 0%, #143358 50%, #0a1f3a 100%);
  color: white;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 110px 20px 60px;
    min-height: auto;
  }
`;

const HeroBadge = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
  margin-bottom: 22px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fbbf24;
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.7);
  }

  @media (max-width: 768px) {
    font-size: 0.7rem;
    padding: 7px 16px;
  }
`;

const HeroHeadline = styled.h1`
  position: relative;
  font-size: clamp(2.4rem, 5.5vw, 4rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  max-width: 900px;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.5);

  span {
    background: linear-gradient(120deg, #fbbf24, #f97316);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  @media (max-width: 768px) {
    font-size: 2.4rem;
  }
`;

const HeroSub = styled.p`
  position: relative;
  font-size: clamp(1.05rem, 2.2vw, 1.3rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.92);
  max-width: 620px;
  margin-top: 22px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.05rem;
  }
`;

const HeroCTA = styled.button`
  position: relative;
  margin-top: 32px;
  padding: 18px 42px;
  background: linear-gradient(120deg, #fbbf24, #f97316);
  color: #0a1f3a;
  font-size: 1.05rem;
  font-weight: 800;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: 0 6px 28px rgba(249, 115, 22, 0.45);
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 36px rgba(249, 115, 22, 0.6);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 340px;
    padding: 18px 24px;
    font-size: 1.08rem;
  }
`;

const Section = styled.section`
  padding: 90px 24px;
  background: ${({ $alt }) => ($alt ? '#f4f7fb' : '#fefefe')};

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const SectionInner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
`;

const SectionEyebrow = styled.div`
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f97316;
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.9rem, 3.6vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #0f4c81;
  max-width: 800px;
  margin: 0 auto;
`;

const SectionLead = styled.p`
  text-align: center;
  font-size: 1.1rem;
  color: #4a5468;
  max-width: 720px;
  margin: 18px auto 0;
  line-height: 1.7;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const BenefitGrid = styled.div`
  margin-top: 56px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
`;

const BenefitCard = styled.article`
  position: relative;
  padding: 32px 26px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(15, 76, 129, 0.08);
  box-shadow: 0 4px 24px rgba(15, 76, 129, 0.06);
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(15, 76, 129, 0.12);
  }

  ${({ $featured }) =>
    $featured &&
    `
    background: linear-gradient(140deg, #0f4c81, #143358);
    color: white;
    border: none;

    h3 { color: white; }
    p  { color: rgba(255,255,255,0.82); }
  `}
`;

const BenefitIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $featured }) =>
    $featured ? 'rgba(251, 191, 36, 0.2)' : 'rgba(15, 76, 129, 0.08)'};
  color: ${({ $featured }) => ($featured ? '#fbbf24' : '#0f4c81')};
  margin-bottom: 18px;
`;

const BenefitTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f4c81;
  margin: 0 0 8px;
`;

const BenefitText = styled.p`
  font-size: 0.95rem;
  color: #4a5468;
  line-height: 1.6;
  margin: 0;
`;

const VideoDuo = styled.div`
  margin: 56px auto 0;
  max-width: 720px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  video {
    width: 100%;
    aspect-ratio: 9 / 16;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 12px 32px rgba(15, 76, 129, 0.18);
  }

  @media (max-width: 768px) {
    gap: 10px;
    margin-top: 36px;
  }
`;

const FlakeCategoryHeading = styled.h3`
  margin-top: 56px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #0f4c81;
  text-transform: uppercase;

  &::after {
    content: '';
    display: block;
    margin: 12px auto 0;
    width: 60px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(90deg, #fbbf24, #f97316);
  }
`;

const FlakeGrid = styled.div`
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 18px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 380px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FlakeCard = styled.figure`
  position: relative;
  margin: 0;
  aspect-ratio: 1;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(15, 76, 129, 0.06);
  box-shadow: 0 2px 10px rgba(15, 76, 129, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 22px rgba(15, 76, 129, 0.14);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FlakeName = styled.figcaption`
  position: absolute;
  inset: auto 0 0 0;
  padding: 22px 8px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0) 100%);
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
`;

const ColorsNote = styled.p`
  margin: 48px auto 0;
  max-width: 680px;
  text-align: center;
  font-size: 0.95rem;
  color: #4a5468;
  line-height: 1.65;

  a {
    color: #0f4c81;
    font-weight: 600;
    border-bottom: 1px solid currentColor;
  }
`;

const FinalCta = styled.section`
  padding: 80px 24px;
  background: linear-gradient(140deg, #0f4c81, #0a1f3a);
  color: white;
  text-align: center;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const FinalCtaTitle = styled.h2`
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  max-width: 720px;
  margin: 0 auto 14px;
`;

const FinalCtaSub = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.78);
  max-width: 620px;
  margin: 0 auto 30px;
  line-height: 1.6;
`;

/* ── Inline SVG icons ─────────────────────────────────────────────── */
const SunIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const DropIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);
const FlameIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.93 0 3.5-1.57 3.5-3.5 0-1.45-.66-2.21-1.5-3-.51-.48-1-.96-1.46-1.85a.96.96 0 0 0-1.66.07c-.51 1.02-1.02 1.43-1.59 1.78A2.5 2.5 0 0 0 8.5 14.5z" />
    <path d="M14.42 4c1.86 1.6 3.08 4.13 3.08 7 0 4.69-3.81 8.5-8.5 8.5S.5 15.69.5 11C.5 7.32 2.36 4.05 5.18 2.13c.43-.29.95.15.81.66C5.06 5.95 6.86 9.5 9 9.5c1.78 0 3.18-.59 4.06-1.92.34-.51 1.13-.18 1.36.42z" />
  </svg>
);
const ShieldIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

/* ── Component ────────────────────────────────────────────────────── */
const Patios = () => {
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  // Just ensures the videos start playing on mount inside any iframe contexts.
  useEffect(() => {
    [videoARef, videoBRef].forEach((r) => {
      if (r.current) r.current.play().catch(() => {});
    });
  }, []);

  const scrollToContact = () => {
    const el = document.getElementById('patio-contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageContainer>
      <SEO />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Hero>
        <HeroBadge>UV-Resistant Patio Coatings</HeroBadge>
        <HeroHeadline>
          A patio that shrugs off the <span>New Mexico sun</span>
        </HeroHeadline>
        <HeroSub>
          Polyaspartic UV-stable coatings over your existing concrete. No fading, no staining, no resealing every two years &mdash; serving Albuquerque, Santa Fe &amp; Rio Rancho.
        </HeroSub>
        <HeroCTA onClick={scrollToContact}>Get Your Free Patio Quote</HeroCTA>
      </Hero>

      {/* ── Benefits ─────────────────────────────────────────────── */}
      <Section>
        <SectionInner>
          <SectionEyebrow>Why coat your patio</SectionEyebrow>
          <SectionTitle>Built for sun, spills, and seasons</SectionTitle>
          <SectionLead>
            NM concrete patios take a beating &mdash; UV exposure, freeze-thaw cycles, and every Sunday cookout. Our outdoor system locks color in, seals the slab, and stays as good as the day we left.
          </SectionLead>

          <BenefitGrid>
            <BenefitCard $featured>
              <BenefitIcon $featured><SunIcon /></BenefitIcon>
              <BenefitTitle style={{ color: 'white' }}>UV-Stable, Zero Fade</BenefitTitle>
              <BenefitText>
                Torginol UV+ flake under a polyaspartic topcoat &mdash; engineered for direct sun. The color you choose today is the color you'll have a decade from now.
              </BenefitText>
            </BenefitCard>
            <BenefitCard $featured>
              <BenefitIcon $featured><DropIcon /></BenefitIcon>
              <BenefitTitle style={{ color: 'white' }}>Stains Wipe Right Off</BenefitTitle>
              <BenefitText>
                Wine, BBQ grease, fertilizer, sunscreen, dog accidents &mdash; nothing penetrates a sealed polyaspartic surface. A garden hose is your only maintenance.
              </BenefitText>
            </BenefitCard>
            <BenefitCard>
              <BenefitIcon><FlameIcon /></BenefitIcon>
              <BenefitTitle>Heat &amp; Freeze-Thaw Proof</BenefitTitle>
              <BenefitText>
                Stays flexible from 110°F desert sun to 20°F winter mornings. No cracking, no peeling, no lifting at the edges.
              </BenefitText>
            </BenefitCard>
            <BenefitCard>
              <BenefitIcon><ShieldIcon /></BenefitIcon>
              <BenefitTitle>Lifetime Warranty</BenefitTitle>
              <BenefitText>
                Same warranty we put on garages &mdash; on prepared concrete we install. We stand behind the bond, the color, and the topcoat for as long as you own the home.
              </BenefitText>
            </BenefitCard>
          </BenefitGrid>

          <VideoDuo>
            <video ref={videoARef} autoPlay muted loop playsInline preload="metadata" aria-label="Patio epoxy coating installation in Albuquerque">
              <source src="/videos/patio1.webm" type="video/webm" />
              <source src="/videos/patio1.mp4" type="video/mp4" />
            </video>
            <video ref={videoBRef} autoPlay muted loop playsInline preload="metadata" aria-label="Finished UV-resistant patio coating in New Mexico">
              <source src="/videos/patio2.webm" type="video/webm" />
              <source src="/videos/patio2.mp4" type="video/mp4" />
            </video>
          </VideoDuo>
        </SectionInner>
      </Section>

      {/* ── UV+ Flake Selection ──────────────────────────────────── */}
      <Section $alt>
        <SectionInner>
          <SectionEyebrow>Our UV+ Flake Collection</SectionEyebrow>
          <SectionTitle>Outdoor-grade colors that won't fade</SectionTitle>
          <SectionLead>
            Standard indoor flake fades under direct UV. Our patio system uses the full Torginol UV+ line &mdash; engineered specifically for outdoor concrete. Pick your style; we'll match it to your space.
          </SectionLead>

          <FlakeCategoryHeading>Standard 1/4" Flake</FlakeCategoryHeading>
          <FlakeGrid>
            {standardFlakes.map((f) => (
              <FlakeCard key={f.filename}>
                <img src={f.img} alt={`${f.name} UV-resistant epoxy patio flake blend`} loading="lazy" width="400" height="400" />
                <FlakeName>{f.name}</FlakeName>
              </FlakeCard>
            ))}
          </FlakeGrid>

          <FlakeCategoryHeading>Hybrid Flake</FlakeCategoryHeading>
          <FlakeGrid>
            {hybridFlakes.map((f) => (
              <FlakeCard key={f.filename}>
                <img src={f.img} alt={`${f.name} UV-resistant hybrid epoxy patio flake blend`} loading="lazy" width="400" height="400" />
                <FlakeName>{f.name}</FlakeName>
              </FlakeCard>
            ))}
          </FlakeGrid>

          <ColorsNote>
            Looking at indoor garage colors instead? Check our full <Link to="/colors">flake catalog</Link>. For patios, we recommend sticking with the UV+ line above &mdash; it's the only flake rated for permanent outdoor exposure.
          </ColorsNote>
        </SectionInner>
      </Section>

      {/* ── Final CTA + Form ─────────────────────────────────────── */}
      <FinalCta id="patio-contact">
        <FinalCtaTitle>Quote your patio in minutes.</FinalCtaTitle>
        <FinalCtaSub>
          Tell us about your space &mdash; square footage, condition, and the look you're going for. We'll come measure for free and have a written quote within 48 hours.
        </FinalCtaSub>
        <ContactForm />
      </FinalCta>
    </PageContainer>
  );
};

export default Patios;
