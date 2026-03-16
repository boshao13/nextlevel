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
  color: white;

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
    linear-gradient(
      to bottom,
      rgba(5, 15, 35, 0.5) 0%,
      rgba(5, 15, 35, 0.35) 50%,
      rgba(5, 15, 35, 0.6) 75%,
      white 100%
    );

  @media (max-width: 768px) {
    background:
      linear-gradient(
        to bottom,
        rgba(5, 15, 35, 0.35) 0%,
        rgba(5, 15, 35, 0.25) 40%,
        rgba(5, 15, 35, 0.65) 70%,
        white 100%
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

const Badge = styled.span`
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
    gap: 6px;
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

const Headline = styled.h2`
  font-size: clamp(2.6rem, 5.5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: white;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 2.6rem;
    line-height: 1.1;
  }
`;

const Subtitle = styled.p`
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

const ButtonRow = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    max-width: 340px;
  }
`;

const PrimaryBtn = styled.button`
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
    padding: 18px 24px;
    font-size: 1.08rem;
  }
`;

const GhostBtn = styled.button`
  padding: 18px 40px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-full);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background var(--transition), border-color var(--transition), transform var(--transition);

  &:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: white;
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

  svg {
    flex-shrink: 0;
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

  @media (max-width: 768px) {
    display: none;
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
    if (videoRef.current) videoRef.current.load();
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
      <video ref={videoRef} autoPlay loop muted playsInline preload="auto">
        <source src={src.webm} type="video/webm" />
        <source src={src.mp4}  type="video/mp4" />
      </video>
      <Overlay />

      <HeroContent>
        <Badge>Now Booking — Albuquerque &amp; Santa Fe</Badge>
        <Headline>
          If Your Garage Could Talk,<br />
          It'd Call Us.
        </Headline>
        <Subtitle>
          We install the best epoxy floors in New Mexico — durable, beautiful,
          and backed by a lifetime warranty.
        </Subtitle>
        <ButtonRow>
          <PrimaryBtn onClick={scrollToContact}>Get a Free Quote</PrimaryBtn>
          <GhostBtn onClick={scrollToGallery}>See Our Work</GhostBtn>
        </ButtonRow>
        <TrustRow>
          <TrustItem>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Lifetime Warranty
          </TrustItem>
          <TrustItem>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            560+ Floors Done
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
    </HeroSection>
  );
};

export default React.memo(Hero);
