// src/pages/GarageMakeover.jsx
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';

import ContactForm from './ContactForm';

const SEO = () => (
  <Helmet>
    <title>Garage Makeover Package | Epoxy & Polyaspartic Floor Coating | Albuquerque & Santa Fe NM | Next Level Epoxy Flooring</title>
    <meta name="description" content="Complete garage makeover in Albuquerque & Santa Fe, NM. Professional epoxy flooring, polyaspartic garage floor coatings, custom lighting, wall painting & baseboards. One crew, one price - lifetime warranty. Get your free estimate today." />
    <meta name="keywords" content="garage makeover Albuquerque, epoxy garage floor Albuquerque, polyaspartic floor coating Santa Fe, garage floor coating near me, epoxy flooring near me, concrete floor coating New Mexico, garage renovation Albuquerque, metallic epoxy flooring, flake epoxy garage floor, one day garage floor coating, residential epoxy flooring, commercial epoxy flooring, garage transformation, epoxy flooring cost, best garage floor coating" />
    <link rel="canonical" href="https://www.nextlevelepoxynm.com/garage-makeover" />
    <meta property="og:title" content="Complete Garage Makeover | Epoxy & Polyaspartic Floor Coatings | Albuquerque & Santa Fe NM" />
    <meta property="og:description" content="Transform your garage with professional epoxy flooring, polyaspartic coatings, custom lighting & wall finishing. Lifetime warranty. Serving Albuquerque & Santa Fe, NM." />
    <meta property="og:url" content="https://www.nextlevelepoxynm.com/garage-makeover" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg" />
    <script type="application/ld+json">{`
      {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Complete Garage Makeover Package",
        "description": "Professional garage makeover including epoxy flooring, polyaspartic floor coatings, wall painting, baseboard installation, and custom lighting in Albuquerque and Santa Fe, New Mexico.",
        "provider": {
          "@type": "LocalBusiness",
          "name": "Next Level Epoxy Flooring",
          "url": "https://www.nextlevelepoxynm.com",
          "telephone": "+15055551234",
          "areaServed": [
            { "@type": "City", "name": "Albuquerque", "addressRegion": "NM" },
            { "@type": "City", "name": "Santa Fe", "addressRegion": "NM" },
            { "@type": "City", "name": "Rio Rancho", "addressRegion": "NM" },
            { "@type": "City", "name": "Los Lunas", "addressRegion": "NM" }
          ],
          "priceRange": "$$"
        },
        "serviceType": ["Epoxy Flooring", "Polyaspartic Floor Coating", "Garage Makeover", "Concrete Floor Coating", "Garage Floor Coating"],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Garage Makeover Services",
          "itemListElement": [
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Epoxy Garage Floor Coating" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Polyaspartic Garage Floor Coating" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Metallic Epoxy Flooring" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Decorative Flake Floor Coating" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Garage Wall Painting & Baseboards" } },
            { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Custom Garage Lighting Installation" } }
          ]
        }
      }
    `}</script>
  </Helmet>
);
const makeoverVideos = [
  { webm: '/videos/makeover1.webm', mp4: '/videos/makeover1.mp4' },
  { webm: '/videos/makeover2.webm', mp4: '/videos/makeover2.mp4' },
  { webm: '/videos/makeover3.webm', mp4: '/videos/makeover3.mp4' },
];

const MOBILE_MQ = '(max-width: 768px)';
const mobileSrc  = { webm: '/videos/makeover-mobile.webm',  mp4: '/videos/makeover-mobile.mp4' };
const desktopSrc = { webm: '/videos/makeover-desktop.webm', mp4: '/videos/makeover-desktop.mp4' };

const PageContainer = styled.div`
  overflow-x: hidden;
  width: 100%;
`;

const HeroSection = styled.section`
  position: relative;
  height: 100dvh;
  height: 100vh;
  min-height: 600px;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    min-height: 100svh;
  }
`;

const HeroVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(5, 15, 35, 0.5) 0%,
    rgba(5, 15, 35, 0.35) 50%,
    rgba(5, 15, 35, 0.6) 75%,
    #fefefe 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;

  @media (max-width: 768px) {
    background: linear-gradient(
      to bottom,
      rgba(5, 15, 35, 0.35) 0%,
      rgba(5, 15, 35, 0.25) 40%,
      rgba(5, 15, 35, 0.65) 70%,
      #fefefe 100%
    );
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 28px;
  max-width: 900px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;

  @media (max-width: 768px) {
    gap: 18px;
    padding: 0 20px;
  }
`;

const HeroBadge = styled.span`
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
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    font-size: 0.68rem;
    padding: 7px 16px;
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  }
`;

const HeroHeadline = styled.h1`
  font-size: clamp(2.6rem, 5.5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: white;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 2.4rem;
  }
`;

const HeroSub = styled.p`
  font-size: clamp(1.05rem, 2.2vw, 1.3rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.92);
  max-width: 560px;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
  line-height: 1.65;

  @media (max-width: 768px) {
    font-size: 1.05rem;
    line-height: 1.55;
  }
`;

const HeroCTA = styled.button`
  padding: 18px 40px;
  background: var(--primary);
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(15, 76, 129, 0.5);
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(15, 76, 129, 0.6);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 340px;
    padding: 18px 24px;
    font-size: 1.08rem;
  }
`;

const TrustRow = styled.div`
  display: flex;
  gap: 28px;
  align-items: center;
  margin-top: 4px;

  @media (max-width: 600px) {
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const TrustItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.02em;

  svg { flex-shrink: 0; }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    bottom: 24px;
  }

  span {
    display: block;
    width: 24px;
    height: 38px;
    border: 2px solid rgba(255, 255, 255, 0.45);
    border-radius: 12px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 8px;
      background: white;
      border-radius: 2px;
      animation: bounce 1.6s infinite;
    }
  }

  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50%      { transform: translateX(-50%) translateY(8px); }
  }
`;

const PageWrapper = styled.section`
  background-color: #fefefe;
  min-height: 100vh;
  color: #0f4c81;
  padding-bottom: 100px;

  @media (max-width: 768px) {
    padding-bottom: 60px;
  }
`;

const Subheading = styled.p`
  font-size: 1.4rem;
  text-align: center;
  margin: 40px 0 20px;
  padding: 0 20px;

  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin: 30px 0 16px;
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 50px;
  line-height: 1.6;
  padding: 0 20px;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin: 0 auto 30px;
    line-height: 1.5;
  }
`;

const VideoWrapper = styled.div`
  width: 90vw;
  margin: 0 auto 60px;
  display: flex;
  justify-content: center;
  gap: 20px;

  video {
    width: calc(33.333% - 13.333px);
    height: auto;
    aspect-ratio: 9 / 16;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 8px;
    margin: 0 auto 30px;

    video {
      width: calc(33.333% - 6px);
      max-height: 45vh;
    }
  }
`;

const BeforeAfterHeading = styled.h3`
  text-align: center;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  color: #0f4c81;
  margin: 0 auto 40px;
  max-width: 700px;
  line-height: 1.3;
  padding: 0 20px;

  @media (max-width: 768px) {
    font-size: 1.4rem;
    margin: 0 auto 24px;
  }
`;

const BeforeAfterWrapper = styled.div`
  max-width: 900px;
  height: 70vh;
  margin: 0 auto 60px;
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 24px;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    height: auto;
    gap: 0;
    padding: 0 20px;
  }
`;

const BeforeColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 70vh;

  img {
    flex: 1;
    min-height: 0;
    height: calc(50% - 6px);
    border-radius: 10px;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    height: auto;
    gap: 10px;

    img {
      height: auto;
      width: 100%;
      aspect-ratio: auto;
    }
  }
`;

const ArrowIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 8px;

  svg {
    color: #0f4c81;
    filter: drop-shadow(0 2px 4px rgba(15, 76, 129, 0.3));
  }

  span {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #0f4c81;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  @media (max-width: 768px) {
    flex-direction: row;
    padding: 12px 0;

    span {
      writing-mode: horizontal-tb;
      font-size: 0.7rem;
    }

    svg {
      width: 28px;
      height: 28px;
      transform: rotate(90deg);
    }
  }
`;

const AfterColumn = styled.div`
  height: 70vh;

  video {
    height: 100%;
    border-radius: 10px;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    height: auto;
    video {
      width: 100%;
      height: auto;
    }
  }
`;

const Label = styled.p`
  text-align: center;
  font-weight: bold;
  color: #0f4c81;
  margin-bottom: 10px;
  font-size: 1rem;
`;


const GarageMakeover = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches
  );
  const videoRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.load();
  }, [isMobile]);

  return (
    <PageContainer>
      <SEO />
      <HeroSection aria-label="Garage makeover hero section">
        <HeroVideo ref={videoRef} autoPlay muted loop playsInline preload="auto" aria-label="Professional epoxy garage floor coating transformation video">
          {(() => {
            const src = isMobile ? mobileSrc : desktopSrc;
            return (
              <>
                <source src={src.webm} type="video/webm" />
                <source src={src.mp4} type="video/mp4" />
              </>
            );
          })()}
        </HeroVideo>
        <HeroOverlay>
          <HeroContent>
            <HeroBadge>Complete Garage Floor Coating & Makeover</HeroBadge>
            <HeroHeadline>
              Complete Garage Makeover &mdash; Floors, Walls, Lighting & More
            </HeroHeadline>
            <HeroSub>
              Walls, lighting, epoxy & polyaspartic floor coatings &mdash; we handle your entire garage makeover. One crew, one price, zero hassle. Serving Albuquerque, Santa Fe & all of New Mexico.
            </HeroSub>
            <HeroCTA onClick={() => {
              const el = document.getElementById('makeover-details');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              Get Your Free Estimate
            </HeroCTA>
            <TrustRow>
              <TrustItem>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Lifetime Warranty
              </TrustItem>
              <TrustItem>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                All-In-One Garage Makeover
              </TrustItem>
              <TrustItem>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                5-Star Rated
              </TrustItem>
            </TrustRow>
          </HeroContent>
          <ScrollIndicator>
            <span />
          </ScrollIndicator>
        </HeroOverlay>
      </HeroSection>

      <PageWrapper id="makeover-details" as="article">
        <Subheading as="h2">
          Premium Epoxy & Polyaspartic Garage Floor Coating Packages in Albuquerque & Santa Fe
        </Subheading>
        <Description>
          Our complete garage makeover package includes professional wall painting, baseboard installation, custom overhead or recessed lighting, and high-performance epoxy or polyaspartic floor coatings. We transform dusty, cracked concrete garage floors into bright, durable, and stunning spaces &mdash; perfect for parking, home gyms, workshops, or showing off your ride. Our chemical-resistant, UV-stable concrete coatings come with a lifetime warranty and are installed in as little as one day.
        </Description>

        <VideoWrapper>
          {makeoverVideos.map((src, index) => (
            <video key={index} muted loop autoPlay playsInline preload="metadata" aria-label={`Garage floor coating makeover transformation video ${index + 1}`}>
              <source src={src.webm} type="video/webm" />
              <source src={src.mp4} type="video/mp4" />
            </video>
          ))}
        </VideoWrapper>

        <BeforeAfterHeading>
          See the Difference &mdash; Before & After Epoxy Garage Floor Coating
        </BeforeAfterHeading>
        <BeforeAfterWrapper>
          <BeforeColumn>
            <Label>Before</Label>
            <img src="/img/garagebefore.jpg" alt="Cracked bare concrete garage floor before professional epoxy coating in Albuquerque NM" loading="lazy" />
            <img src="/img/garagebefore1.jpg" alt="Unfinished garage with stained concrete floor before polyaspartic floor coating in Santa Fe NM" loading="lazy" />
          </BeforeColumn>
          <ArrowIndicator aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span>Professional Transformation</span>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </ArrowIndicator>
          <AfterColumn>
            <Label>After</Label>
            <video muted loop autoPlay playsInline preload="metadata" aria-label="Completed epoxy garage floor coating with decorative flake finish after professional makeover">
              <source src="/videos/garageafter.webm" type="video/webm" />
              <source src="/videos/garageafter.mp4" type="video/mp4" />
            </video>
          </AfterColumn>
        </BeforeAfterWrapper>

        <ContactForm />
      </PageWrapper>
    </PageContainer>
  );
};

export default GarageMakeover;
