import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import useScrollReveal from './useScrollReveal';
import epoxyDiagram from './images/epoxydiagram.jpg';

/* ── Floor count: starts at 566 on March 13 2026, +1 every 2 days ── */
const BASE_COUNT = 566;
const BASE_DATE = new Date('2026-03-13T00:00:00');

function getFloorCount() {
  const now = new Date();
  const msElapsed = now - BASE_DATE;
  const daysElapsed = Math.max(0, Math.floor(msElapsed / (1000 * 60 * 60 * 24)));
  return BASE_COUNT + Math.floor(daysElapsed / 2);
}

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 100px 24px 32px;
  background: var(--bg);

  @media (max-width: 900px) {
    min-height: auto;
    padding: 80px 24px 48px;
  }
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const SectionLabel = styled.p`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 6px;
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 6px;

  span {
    color: var(--primary);
  }
`;

const SectionSubtitle = styled.p`
  font-size: 0.88rem;
  color: var(--text-mid);
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.5;
`;

/* ── Two-column layout ────────────────────────────────────────────── */
const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const DiagramSide = styled.div`
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 900px) {
    max-width: 480px;
    margin: 0 auto;
    img { height: auto; }
  }
`;

const StepsSide = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
`;

const StepCard = styled.div`
  background: white;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow var(--transition);
  transition-delay: ${({ $delay }) => $delay || '0s'};

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateY(0);
  `}

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover::before {
    transform: scaleX(1);
  }
`;

const StepNumber = styled.div`
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, rgba(15, 76, 129, 0.12), rgba(15, 76, 129, 0.06));
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 6px;
  transition: background var(--transition), transform var(--transition);

  ${StepCard}:hover & {
    background: var(--primary);
    color: white;
    transform: scale(1.05);
  }
`;

const StepTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
  line-height: 1.2;
`;

const StepText = styled.p`
  font-size: 0.75rem;
  color: var(--text-mid);
  line-height: 1.55;
`;

/* ── Stats row ────────────────────────────────────────────────────── */
const StatsRow = styled.div`
  background: var(--primary);
  border-radius: var(--radius-sm);
  padding: 16px 32px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  text-align: center;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    padding: 20px 24px;
    gap: 12px;
  }
`;

const Stat = styled.div``;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.03em;
`;

/* ── Animated Counter ─────────────────────────────────────────────── */
const AnimatedNumber = ({ target, isVisible }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };

    requestAnimationFrame(step);
  }, [isVisible, target]);

  return <>{count.toLocaleString()}</>;
};

/* ── Data ─────────────────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    title: 'Diamond Grinding',
    text: 'We use 20-grit diamond bits on industrial grinders with built-in dust extractors — no dust, no mess. This opens the concrete pores and creates a rough profile so the epoxy mechanically locks in, not just sits on top.',
  },
  {
    num: '02',
    title: '100% Solids Epoxy',
    text: 'We apply 100% solids cycloaliphatic epoxy — zero solvents, zero fillers, maximum mil thickness. It chemically bonds to concrete and cures slower on purpose, giving it time to penetrate and anchor. Fast-cure "one day" resins skip this step entirely.',
  },
  {
    num: '03',
    title: 'Full Flake Broadcast',
    text: 'While the epoxy is still wet, we broadcast decorative vinyl flakes wall-to-wall until the surface is fully covered. This adds color, hides imperfections, and creates a natural texture that improves traction — even when wet.',
  },
  {
    num: '04',
    title: 'Polyaspartic Topcoat',
    text: 'A commercial-grade polyaspartic clear coat is applied to seal and protect. It\'s UV-stable so it won\'t yellow in sunlight, resists hot tire pickup, and gives the floor a high-gloss showroom finish that lasts decades.',
  },
];

/* ── Component ────────────────────────────────────────────────────── */
const EpoxyInfo = () => {
  const floorCount = useMemo(() => getFloorCount(), []);
  const [headerRef, headerVisible] = useScrollReveal();
  const [contentRef, contentVisible] = useScrollReveal({ threshold: 0.1 });
  const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.3 });

  return (
    <Section>
      <Inner>
        <Header ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>Our Process</SectionLabel>
          <SectionTitle>
            Good Floors Take Two Days. <span>Great Ones Are Worth It.</span>
          </SectionTitle>
          <SectionSubtitle>
            "One day" coatings use fast-cure resins that look good on day one and fail on year one.
            We take the extra day because quality epoxy needs time to chemically
            bond to your concrete — and that bond is what makes a floor last forever.
          </SectionSubtitle>
        </Header>

        <ContentLayout ref={contentRef}>
          <DiagramSide className={`reveal-left ${contentVisible ? 'visible' : ''}`}>
            <img
              src={epoxyDiagram}
              alt="Epoxy flooring system layers — concrete, 100% solids cycloaliphatic epoxy base, flake broadcast, and polyaspartic topcoat"
            />
          </DiagramSide>

          <StepsSide>
            {steps.map((s, i) => (
              <StepCard key={s.num} $visible={contentVisible} $delay={`${i * 0.1}s`}>
                <StepNumber>{s.num}</StepNumber>
                <StepTitle>{s.title}</StepTitle>
                <StepText>{s.text}</StepText>
              </StepCard>
            ))}
          </StepsSide>
        </ContentLayout>

        <div ref={statsRef} className={`reveal ${statsVisible ? 'visible' : ''}`}>
          <StatsRow>
            <Stat>
              <StatNumber>
                <AnimatedNumber target={floorCount} isVisible={statsVisible} />
              </StatNumber>
              <StatLabel>Floors Installed &amp; Counting</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>Lifetime</StatNumber>
              <StatLabel>Warranty on Every Job</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>100%</StatNumber>
              <StatLabel>Solids — Zero Solvents</StatLabel>
            </Stat>
          </StatsRow>
        </div>
      </Inner>
    </Section>
  );
};

export default EpoxyInfo;
