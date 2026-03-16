import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import useScrollReveal from './useScrollReveal';

import coyote from './images/flakes/coyote.jpg';
import creekbed from './images/flakes/creekbed.jpg';
import gravel from './images/flakes/gravel.jpg';
import loon from './images/flakes/loon.jpg';
import nightfall from './images/flakes/nightfall.jpg';
import tidalWave from './images/flakes/tidal-wave.jpg';
import thyme from './images/flakes/thyme.jpg';
import wombat from './images/flakes/wombat.jpg';

/* ── Data ─────────────────────────────────────────────────────────── */
const flakes = [
  { name: 'Coyote', img: coyote, popular: true },
  { name: 'Creekbed', img: creekbed },
  { name: 'Gravel', img: gravel },
  { name: 'Loon', img: loon },
  { name: 'Nightfall', img: nightfall, popular: true },
  { name: 'Tidal Wave', img: tidalWave },
  { name: 'Thyme', img: thyme },
  { name: 'Wombat', img: wombat },
];

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  padding: 70px 24px 110px;
  background: white;
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const SectionLabel = styled.p`
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  color: var(--text);
  margin-bottom: 16px;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.05rem;
  color: var(--text-mid);
  max-width: 540px;
  margin: 0 auto 60px;
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
  box-shadow: var(--shadow-sm);
  cursor: default;
  opacity: 0;
  transform: translateY(24px) scale(0.97);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.35s ease;
  transition-delay: ${({ $delay }) => $delay || '0s'};

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateY(0) scale(1);
  `}

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: var(--shadow-md);
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
  background: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorName = styled.p`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
`;

const PopularBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
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
  background: var(--primary);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(15, 76, 129, 0.3);
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(15, 76, 129, 0.4);
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
          <ViewAllBtn to="/colors" onClick={() => window.scrollTo(0, 0)}>
            View All Colors
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </ViewAllBtn>
        </ButtonWrap>
      </Inner>
    </Section>
  );
};

export default FlakeCarousel;
