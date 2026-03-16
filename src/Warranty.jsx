import React from 'react';
import styled, { keyframes } from 'styled-components';
import useScrollReveal from './useScrollReveal';

/* ── Keyframes ────────────────────────────────────────────────────── */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.1); }
  50%      { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
`;

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  background: linear-gradient(160deg, #0a3356 0%, var(--primary) 40%, #0d3f6e 100%);
  padding: 110px 24px;
  overflow: hidden;
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.03);
    pointer-events: none;
  }

  &::before {
    width: 600px;
    height: 600px;
    top: -200px;
    right: -150px;
  }

  &::after {
    width: 400px;
    height: 400px;
    bottom: -150px;
    left: -100px;
  }
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const SectionLabel = styled.p`
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  color: white;
  margin-bottom: 64px;
  line-height: 1.2;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 64px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

const TextSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const WarrantyText = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
`;

const FeatureList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  transition-delay: ${({ $delay }) => $delay || '0s'};

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateX(0);
  `}

  &::before {
    content: '✓';
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    background: rgba(74, 222, 128, 0.2);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #4ade80;
    margin-top: 1px;
  }
`;

const BadgeSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;

  @media (max-width: 900px) {
    order: -1;
  }
`;

const WarrantyBadge = styled.div`
  width: 230px;
  height: 230px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
  animation: ${pulseGlow} 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    border: 2px dashed rgba(255, 255, 255, 0.15);
    animation: ${spin} 18s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -28px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.08);
    animation: ${spin} 30s linear infinite reverse;
  }
`;

const BadgeWord = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
`;

const BadgeBig = styled.span`
  font-size: 1.6rem;
  font-weight: 800;
  color: white;
  text-align: center;
  line-height: 1.15;
`;

const BadgeStar = styled.span`
  font-size: 1.3rem;
  margin-top: 4px;
`;

const QuoteBox = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  padding: 28px 28px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(8px);
  position: relative;

  &::before {
    content: '"';
    position: absolute;
    top: 12px;
    left: 18px;
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.1);
    font-family: Georgia, serif;
    line-height: 1;
  }
`;

const QuoteText = styled.p`
  font-size: 0.95rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.65;
`;

const QuoteAuthor = styled.p`
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

/* ── Component ────────────────────────────────────────────────────── */
const features = [
  'Covers material defects & installation errors',
  'No deductibles, no fine print',
  'Fully transferable if you sell your home',
  'Backed by years of proven installations',
];

const Warranty = () => {
  const [headerRef, headerVisible] = useScrollReveal();
  const [textRef, textVisible] = useScrollReveal();
  const [badgeRef, badgeVisible] = useScrollReveal();

  return (
    <Section>
      <Inner>
        <div ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>Our Promise</SectionLabel>
          <SectionTitle>Lifetime Warranty</SectionTitle>
        </div>

        <Layout>
          <TextSide ref={textRef}>
            <div className={`reveal ${textVisible ? 'visible' : ''}`}>
              <WarrantyText>
                We're so confident in the quality and durability of our epoxy flooring system that we offer a <strong style={{ color: 'white' }}>lifetime warranty</strong> on every floor we install. When you choose Next Level, you're not just getting a beautiful floor — you're getting complete peace of mind.
              </WarrantyText>
            </div>
            <div className={`reveal ${textVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
              <WarrantyText>
                Our floors are built to last, and we stand behind them 100%. If anything goes wrong due to material defects or installation errors, we've got you covered.
              </WarrantyText>
            </div>
            <FeatureList>
              {features.map((f, i) => (
                <FeatureItem key={i} $visible={textVisible} $delay={`${0.3 + i * 0.1}s`}>
                  {f}
                </FeatureItem>
              ))}
            </FeatureList>
          </TextSide>

          <BadgeSide ref={badgeRef} className={`reveal-scale ${badgeVisible ? 'visible' : ''}`}>
            <WarrantyBadge>
              <BadgeWord>Next Level</BadgeWord>
              <BadgeBig>Lifetime<br />Warranty</BadgeBig>
              <BadgeStar>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </BadgeStar>
              <BadgeWord>Guaranteed</BadgeWord>
            </WarrantyBadge>

            <QuoteBox>
              <QuoteText>
                "We don't just install floors — we install confidence. Every job gets the same care, whether it's a one-car garage or a 10,000 sq ft warehouse."
              </QuoteText>
              <QuoteAuthor>— Next Level Epoxy Team</QuoteAuthor>
            </QuoteBox>
          </BadgeSide>
        </Layout>
      </Inner>
    </Section>
  );
};

export default Warranty;
