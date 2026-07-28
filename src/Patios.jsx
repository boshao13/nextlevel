'use client';

// src/Patios.jsx — UV-resistant epoxy patio coatings
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

import ContactForm from './ContactForm';
import SwatchModal from './components/SwatchModal';
import UV_SKUS from './uvFlakeSkus';


/* ── UV+ flake catalog (Torginol UV+ line) ─────────────────────────
   Images serve from /public/images/uv-flakes (copied from src/images/
   uv-flakes). The 36 jpg filenames there are exactly the keys of UV_SKUS
   (verified 2026-07-20) and each has a .webp sibling (scripts/convert-webp.mjs)
   that we actually serve, so the list derives from UV_SKUS — no webpack
   require.context, which does not exist under Next. */
const STANDARD_NAMES = new Set([
  'veranda','courtyard','chalet','saltbox','rooftop','homestead','cottage',
  'townhome','villa','pueblo','beach-house','loft','ranch','bower','chateau',
  'midcentury','bungalow','manor','ironwork','rowhouse','castle','terrace',
  'tudor','brownstone',
]);

const allUvFlakes = Object.keys(UV_SKUS).sort().map((filename) => {
  const name = filename
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    name,
    filename,
    img: `/images/uv-flakes/${filename}.webp`,
    sku: UV_SKUS[filename] || '',
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
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  border-bottom: 1px solid var(--line);
  color: var(--text-hi);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
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
  background: rgba(240, 165, 0, 0.1);
  border: 1px solid rgba(240, 165, 0, 0.25);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--resin);
  backdrop-filter: blur(12px);
  margin-bottom: 22px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--resin-hot);
    box-shadow: 0 0 10px rgba(240, 165, 0, 0.6);
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
    background: var(--resin-grad);
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
  color: var(--text-body);
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
  background: var(--resin-grad);
  color: #14110a;
  font-size: 1.05rem;
  font-weight: 800;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(240, 165, 0, 0.25);
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
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
  background: ${({ $alt }) => ($alt ? 'var(--bg1)' : 'var(--bg0)')};

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
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--resin);
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.9rem, 3.6vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--text-hi);
  max-width: 800px;
  margin: 0 auto;
`;

const SectionLead = styled.p`
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-body);
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
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-dk-sm);
  text-align: left;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(240, 165, 0, 0.35);
    box-shadow: var(--shadow-dk-md);
  }

  ${({ $featured }) =>
    $featured &&
    `
    background: linear-gradient(140deg, var(--surface-2), var(--surface));
    border-color: rgba(240, 165, 0, 0.25);

    h3 { color: var(--text-hi); }
    p  { color: var(--text-body); }
  `}
`;

const BenefitIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 165, 0, 0.12);
  border: 1px solid rgba(240, 165, 0, 0.25);
  color: var(--resin-hot);
  margin-bottom: 18px;
`;

const BenefitTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-hi);
  margin: 0 0 8px;
`;

const BenefitText = styled.p`
  font-size: 0.95rem;
  color: var(--text-body);
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
    background: #0a0b0e;
    border: 1px solid var(--line);
    box-shadow: var(--shadow-dk-md);
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
  color: var(--text-hi);
  text-transform: uppercase;

  &::after {
    content: '';
    display: block;
    margin: 12px auto 0;
    width: 60px;
    height: 3px;
    border-radius: 2px;
    background: var(--resin);
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

const FlakeCard = styled.button`
  position: relative;
  margin: 0;
  padding: 0;
  display: block;
  width: 100%;
  font-family: inherit;
  cursor: pointer;
  aspect-ratio: 1;
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-dk-sm);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(240, 165, 0, 0.35);
    box-shadow: var(--shadow-dk-md);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FlakeName = styled.span`
  display: block;
  position: absolute;
  inset: auto 0 0 0;
  padding: 22px 8px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0) 100%);
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-hi);
  letter-spacing: 0.02em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
`;

const ColorsNote = styled.p`
  margin: 48px auto 0;
  max-width: 680px;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-dim);
  line-height: 1.65;

  a {
    color: var(--resin);
    font-weight: 600;
    border-bottom: 1px solid currentColor;
    transition: color var(--transition);

    &:hover {
      color: var(--resin-hot);
    }
  }
`;

const FinalCta = styled.section`
  padding: 80px 24px;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  border-top: 1px solid var(--line);
  color: var(--text-hi);
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
  color: var(--text-body);
  max-width: 620px;
  margin: 0 auto 30px;
  line-height: 1.6;
`;

/* ── Inline SVG icons ─────────────────────────────────────────────── */
const SunIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const DropIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);
const FlameIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.93 0 3.5-1.57 3.5-3.5 0-1.45-.66-2.21-1.5-3-.51-.48-1-.96-1.46-1.85a.96.96 0 0 0-1.66.07c-.51 1.02-1.02 1.43-1.59 1.78A2.5 2.5 0 0 0 8.5 14.5z" />
    <path d="M14.42 4c1.86 1.6 3.08 4.13 3.08 7 0 4.69-3.81 8.5-8.5 8.5S.5 15.69.5 11C.5 7.32 2.36 4.05 5.18 2.13c.43-.29.95.15.81.66C5.06 5.95 6.86 9.5 9 9.5c1.78 0 3.18-.59 4.06-1.92.34-.51 1.13-.18 1.36.42z" />
  </svg>
);
const ShieldIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

/* ── Component ────────────────────────────────────────────────────── */
const Patios = () => {
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  const [selectedFlake, setSelectedFlake] = useState(null);
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
              <BenefitTitle style={{ color: 'var(--text-hi)' }}>UV-Stable, Zero Fade</BenefitTitle>
              <BenefitText>
                Torginol UV+ flake under a polyaspartic topcoat &mdash; engineered for direct sun. The color you choose today is the color you'll have a decade from now.
              </BenefitText>
            </BenefitCard>
            <BenefitCard $featured>
              <BenefitIcon $featured><DropIcon /></BenefitIcon>
              <BenefitTitle style={{ color: 'var(--text-hi)' }}>Stains Wipe Right Off</BenefitTitle>
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
            <video ref={videoARef} autoPlay muted loop playsInline preload="metadata" poster="/videos/posters/patio1.jpg" aria-label="Patio epoxy coating installation in Albuquerque">
              <source src="/videos/patio1.webm" type="video/webm" />
              <source src="/videos/patio1.mp4" type="video/mp4" />
            </video>
            <video ref={videoBRef} autoPlay muted loop playsInline preload="metadata" poster="/videos/posters/patio2.jpg" aria-label="Finished UV-resistant patio coating in New Mexico">
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
              <FlakeCard
                key={f.filename}
                type="button"
                aria-label={`View ${f.name}`}
                onClick={() => setSelectedFlake({ ...f, collection: 'UV+ Standard 1/4" Flake' })}
              >
                <img src={f.img} alt={`${f.name} UV-resistant epoxy patio flake blend`} loading="lazy" width="400" height="400" />
                <FlakeName>{f.name}</FlakeName>
              </FlakeCard>
            ))}
          </FlakeGrid>

          <FlakeCategoryHeading>Hybrid Flake</FlakeCategoryHeading>
          <FlakeGrid>
            {hybridFlakes.map((f) => (
              <FlakeCard
                key={f.filename}
                type="button"
                aria-label={`View ${f.name}`}
                onClick={() => setSelectedFlake({ ...f, collection: 'UV+ Hybrid Flake' })}
              >
                <img src={f.img} alt={`${f.name} UV-resistant hybrid epoxy patio flake blend`} loading="lazy" width="400" height="400" />
                <FlakeName>{f.name}</FlakeName>
              </FlakeCard>
            ))}
          </FlakeGrid>

          <ColorsNote>
            Looking at indoor garage colors instead? Check our full <Link href="/colors">flake catalog</Link>. For patios, we recommend sticking with the UV+ line above &mdash; it's the only flake rated for permanent outdoor exposure.
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

      {selectedFlake && (
        <SwatchModal
          item={selectedFlake}
          onClose={() => setSelectedFlake(null)}
          onQuote={scrollToContact}
        />
      )}
    </PageContainer>
  );
};

export default Patios;
