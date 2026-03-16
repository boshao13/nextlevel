import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import useScrollReveal from './useScrollReveal';

// ─── Assets ─────────────────────────────────────────────────────────────────
const videoPairs    = [
  { webm: '/videos/gallery1.webm', mp4: '/videos/gallery1.mp4', label: 'Gravel' },
  { webm: '/videos/gallery2.webm', mp4: '/videos/gallery2.mp4', label: 'Onyx' },
  { webm: '/videos/gallery3.webm', mp4: '/videos/gallery3.mp4', label: 'Outback' },
];

// ─── Styled Components ────────────────────────────────────────────────────────
const Section = styled.section`
  padding: 60px 24px;
  background: var(--bg);
  overflow: hidden;
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionLabel = styled.p`
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.05rem;
  color: var(--text-mid);
  max-width: 540px;
  margin: 0 auto 24px;
  line-height: 1.7;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    gap: 20px;
  }
`;

const VideoCard = styled.div`
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background: #111;
  position: relative;
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  video {
    width: 100%;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    display: block;
  }
`;

const VideoLabel = styled.span`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 20px;
`;

const InstagramBanner = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 28px 32px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #fff;
  text-decoration: none;
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    padding: 24px 20px;
  }
`;

const InstagramIcon = styled.svg`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
`;

const InstagramText = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.02em;

  span {
    display: block;
    font-size: 0.85rem;
    font-weight: 400;
    opacity: 0.9;
    margin-top: 4px;
  }
`;

// ─── Intersection-observer video ──────────────────────────────────────────────
const LazyVideo = React.memo(({ webm, mp4 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video ref={ref} loop muted playsInline preload="metadata">
      {webm && <source src={webm} type="video/webm" />}
      {mp4  && <source src={mp4}  type="video/mp4" />}
    </video>
  );
});

// ─── Component ────────────────────────────────────────────────────────────────
const Gallery = () => {
  const [headerRef, headerVisible] = useScrollReveal();
  const [contentRef, contentVisible] = useScrollReveal({ threshold: 0.05 });

  return (
    <Section id="gallery">
      <Inner>
        <div ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>Portfolio</SectionLabel>
          <SectionTitle>Watch The Magic</SectionTitle>
          <SectionSubtitle>
            A closer look at our professional epoxy flooring transformations across New Mexico.
          </SectionSubtitle>
        </div>

        <div ref={contentRef} className={`reveal ${contentVisible ? 'visible' : ''}`}>
          <VideoGrid>
            {videoPairs.map((v, i) => (
              <VideoCard key={i}>
                <LazyVideo webm={v.webm} mp4={v.mp4} />
                <VideoLabel>{v.label}</VideoLabel>
              </VideoCard>
            ))}
          </VideoGrid>

          <InstagramBanner
            href="https://www.instagram.com/nextlevelepoxynm/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </InstagramIcon>
            <InstagramText>
              Follow Us on Instagram
              <span>@nextlevelepoxynm — See more transformations</span>
            </InstagramText>
          </InstagramBanner>
        </div>
      </Inner>
    </Section>
  );
};

export default Gallery;
