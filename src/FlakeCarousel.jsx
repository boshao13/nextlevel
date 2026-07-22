'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import useScrollReveal from './useScrollReveal';

/* ── Data ─────────────────────────────────────────────────────────── */
/* Swatch jpgs are served from public/images/flakes (gitignored but required
   locally; deploy rsyncs public/). Task 13 builds the full /colors manifest
   from the same tree. */
const flakes = [
  { name: 'Coyote', img: '/images/flakes/coyote.jpg', popular: true },
  { name: 'Creekbed', img: '/images/flakes/creekbed.jpg' },
  { name: 'Gravel', img: '/images/flakes/gravel.jpg' },
  { name: 'Loon', img: '/images/flakes/loon.jpg' },
  { name: 'Nightfall', img: '/images/flakes/nightfall.jpg', popular: true },
  { name: 'Tidal Wave', img: '/images/flakes/tidal-wave.jpg' },
  { name: 'Thyme', img: '/images/flakes/thyme.jpg' },
  { name: 'Wombat', img: '/images/flakes/wombat.jpg' },
];

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  padding: var(--section-pad) 24px;
  background: var(--bg0);
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const SectionLabel = styled.p`
  text-align: center;
  font-size: var(--fs-eyebrow);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--resin);
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: var(--fs-h2);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-hi);
  margin-bottom: 16px;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.05rem;
  color: var(--text-body);
  max-width: 540px;
  margin: 0 auto 56px;
  line-height: 1.7;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
`;

const Card = styled.div`
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-dk-sm);
  cursor: default;
  opacity: 0;
  transform: translateY(24px) scale(0.97);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.35s ease,
              box-shadow 0.35s ease;
  transition-delay: ${({ $delay }) => $delay || '0s'};

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateY(0) scale(1);
  `}

  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(240, 165, 0, 0.4);
    box-shadow: var(--shadow-dk-md), var(--glow-resin);
  }
`;

const SwatchImg = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;

  @media (max-width: 700px) {
    height: 120px;
  }
`;

const CardBody = styled.div`
  padding: 12px 16px 14px;
  background: var(--surface);
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorName = styled.p`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-hi);
`;

const PopularBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  background: var(--resin-grad);
  color: #14110a;
  font-size: 0.62rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const ButtonWrap = styled.div`
  text-align: center;
  margin-top: 48px;
`;

const ViewAllBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 36px;
  background: var(--resin-grad);
  color: #14110a;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 22px rgba(240, 165, 0, 0.3);
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(240, 165, 0, 0.42);
  }

  svg {
    flex-shrink: 0;
  }
`;

/* ── Component ────────────────────────────────────────────────────── */
const FlakeCarousel = () => {
  const [headerRef, headerVisible] = useScrollReveal();
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.1 });

  return (
    <Section>
      <Inner>
        <div ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>Color Selection</SectionLabel>
          <SectionTitle>Choose Wisely</SectionTitle>
          <SectionSubtitle>
            Pick your favorite flake color from our most popular selection. Not sure? We bring samples to every consultation.
          </SectionSubtitle>
        </div>

        <Grid ref={gridRef}>
          {flakes.map((f, i) => (
            <Card
              key={f.name}
              $visible={gridVisible}
              $delay={`${i * 0.08}s`}
            >
              <SwatchImg src={f.img} alt={f.name} loading="lazy" />
              <CardBody>
                <ColorName>{f.name}</ColorName>
                {f.popular && <PopularBadge>Popular</PopularBadge>}
              </CardBody>
            </Card>
          ))}
        </Grid>

        <ButtonWrap className={`reveal ${gridVisible ? 'visible' : ''}`}>
          <ViewAllBtn href="/colors" onClick={() => window.scrollTo(0, 0)}>
            View All Colors
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </ViewAllBtn>
        </ButtonWrap>
      </Inner>
    </Section>
  );
};

export default FlakeCarousel;
