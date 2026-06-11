import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

/* ── Keyframes (scroll indicator only) ────────────────────────────── */
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(8px); }
`;

/* ── Styled Components ────────────────────────────────────────────── */
const HeroSection = styled.section`
  position: relative;
  height: 100dvh;
  height: 100vh;
  min-height: 700px;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-hi);
  background: var(--bg0);

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  @media (max-width: 768px) {
    min-height: 100svh;
    justify-content: center;
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(12, 14, 17, 0) 0%, rgba(12, 14, 17, 0.42) 78%),
    linear-gradient(
      to bottom,
      rgba(12, 14, 17, 0.62) 0%,
      rgba(12, 14, 17, 0.32) 42%,
      rgba(12, 14, 17, 0.66) 78%,
      var(--bg0) 100%
    );

  @media (max-width: 768px) {
    background:
      linear-gradient(
        to bottom,
        rgba(12, 14, 17, 0.55) 0%,
        rgba(12, 14, 17, 0.3) 40%,
        rgba(12, 14, 17, 0.72) 74%,
        var(--bg0) 100%
      );
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 28px;
  max-width: 980px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 18px;
    padding: 0 20px;
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 22px;
  background: rgba(18, 21, 26, 0.55);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-hi);
  backdrop-filter: blur(12px);

  @media (max-width: 768px) {
    font-size: 0.66rem;
    padding: 7px 15px;
    gap: 7px;
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--resin-hot);
    box-shadow: 0 0 10px rgba(240, 165, 0, 0.8);
  }
`;

const Headline = styled.h1`
  font-size: var(--fs-hero);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.035em;
  color: var(--text-hi);
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.65);

  em {
    font-style: normal;
    color: var(--resin-hot);
  }

  @media (max-width: 768px) {
    font-size: 2.7rem;
    line-height: 1.08;
  }
`;

const Subtitle = styled.p`
  font-size: var(--fs-lead);
  font-weight: 400;
  color: var(--text-body);
  max-width: 580px;
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.55);
  line-height: 1.65;

  @media (max-width: 768px) {
    font-size: 1.05rem;
    line-height: 1.55;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  margin-top: 6px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    max-width: 340px;
  }
`;

const PrimaryBtn = styled.button`
  padding: 18px 42px;
  background: var(--resin-grad);
  color: #14110a;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: 0 6px 26px rgba(240, 165, 0, 0.35);
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);

  &:hover {
    transform: translateY(-3px);
    filter: brightness(1.07);
    box-shadow: 0 10px 38px rgba(240, 165, 0, 0.45);
  }

  &:active {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 18px 24px;
    font-size: 1.08rem;
  }
`;

const GhostBtn = styled.button`
  padding: 18px 42px;
  background: rgba(18, 21, 26, 0.35);
  color: var(--text-hi);
  font-size: 1.05rem;
  font-weight: 600;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-full);
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background var(--transition), border-color var(--transition), transform var(--transition);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.55);
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 18px 24px;
    font-size: 1.08rem;
  }
`;

const TrustRow = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
  margin-top: 8px;

  @media (max-width: 600px) {
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const TrustItem = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-body);
  letter-spacing: 0.02em;

  svg {
    flex-shrink: 0;
    color: var(--resin);
  }
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
  opacity: 0.65;

  @media (max-width: 768px) {
    display: none;
  }

  span {
    display: block;
    width: 24px;
    height: 38px;
    border: 2px solid rgba(255, 255, 255, 0.4);
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
      background: var(--resin);
      border-radius: 2px;
      animation: ${bounce} 1.6s infinite;
    }
  }
`;

const MOBILE_MQ = '(max-width: 768px)';

const Hero = () => {
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
    if (videoRef.current) {
      videoRef.current.load();
      // Ensure autoplay works inside iframes
      videoRef.current.play().catch(() => {});
    }
  }, [isMobile]);

  const scrollToContact = useCallback(() => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToGallery = useCallback(() => {
    const el = document.getElementById('gallery');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const desktopSrc = { webm: '/videos/hero-desktop.webm', mp4: '/videos/hero-desktop.mp4' };
  const mobileSrc  = { webm: '/videos/hero-mobile.webm',  mp4: '/videos/hero-mobile.mp4'  };
  const src = isMobile ? mobileSrc : desktopSrc;

  return (
    <HeroSection>
      {/* Single poster for both breakpoints: the prerendered attribute survives
          hydration unchanged, so LCP stays anchored to the early poster paint. */}
      <video ref={videoRef} autoPlay loop muted playsInline preload="metadata" poster="/videos/posters/hero.jpg">
        <source src={src.webm} type="video/webm" />
        <source src={src.mp4}  type="video/mp4" />
      </video>
      <Overlay />

      <HeroContent>
        <Badge>Now Booking — Albuquerque, Santa Fe &amp; Rio Rancho</Badge>
        <Headline>
          If Your Garage Could Talk,<br />
          <em>It'd Call Us</em>
        </Headline>
        <Subtitle>
          New Mexico's #1 epoxy &amp; polyaspartic flooring crew — Albuquerque, Santa Fe &amp;
          Rio Rancho's most trusted name in garage and concrete coatings.
        </Subtitle>
        <ButtonRow>
          <PrimaryBtn onClick={scrollToContact}>Get a Free Quote</PrimaryBtn>
          <GhostBtn onClick={scrollToGallery}>See Our Work</GhostBtn>
        </ButtonRow>
        <TrustRow>
          <TrustItem>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Lifetime Warranty
          </TrustItem>
          <TrustItem>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            560+ Floors Done
          </TrustItem>
          <TrustItem>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            5-Star Rated
          </TrustItem>
        </TrustRow>
      </HeroContent>

      <ScrollIndicator>
        <span />
      </ScrollIndicator>
    </HeroSection>
  );
};

export default React.memo(Hero);
