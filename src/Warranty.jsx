'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import useScrollReveal from './useScrollReveal';
import { GlossSweep, GrindRing, ConcreteTexture } from './accents';

/* ── Keyframes ────────────────────────────────────────────────────── */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  padding: var(--section-pad) 24px;
  overflow: hidden;
  position: relative;
`;

const BgRing = styled(GrindRing)`
  position: absolute;
  top: -140px;
  right: -120px;
  color: var(--steel);
  opacity: 0.1;
  pointer-events: none;

  @media (max-width: 900px) {
    top: -200px;
    right: -200px;
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
  color: var(--text-body);
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
  color: var(--text-hi);
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
    background: rgba(240, 165, 0, 0.14);
    border: 1px solid rgba(240, 165, 0, 0.35);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--resin-hot);
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
  border: 3px solid rgba(240, 165, 0, 0.4);
  background: rgba(24, 28, 34, 0.75);
  backdrop-filter: blur(12px);
  box-shadow: var(--glow-resin), var(--shadow-dk-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    border: 2px dashed rgba(240, 165, 0, 0.22);
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
  color: var(--text-dim);
`;

const BadgeBig = styled.span`
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-hi);
  text-align: center;
  line-height: 1.15;
`;

const BadgeStar = styled.span`
  font-size: 1.3rem;
  margin-top: 4px;
`;

const QuoteBox = styled.div`
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 28px 28px;
  width: 100%;
  text-align: center;
  position: relative;

  &::before {
    content: '"';
    position: absolute;
    top: 12px;
    left: 18px;
    font-size: 3rem;
    color: rgba(240, 165, 0, 0.18);
    font-family: Georgia, serif;
    line-height: 1;
  }
`;

const QuoteText = styled.p`
  font-size: 0.95rem;
  font-style: italic;
  color: var(--text-body);
  line-height: 1.65;
`;

const QuoteAuthor = styled.p`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-dim);
  margin-top: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Asterisk = styled.sup`
  color: var(--resin-hot);
  font-weight: 700;
  margin-left: 1px;
`;

const FootnoteText = styled.p`
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--text-dim);
  padding-left: 14px;
  border-left: 2px solid rgba(240, 165, 0, 0.45);

  strong {
    color: var(--text-body);
    font-weight: 600;
  }
`;

const SlipDisclaimer = styled.p`
  max-width: 820px;
  margin: 56px auto 0;
  font-size: 0.75rem;
  line-height: 1.55;
  color: var(--text-dim);
  text-align: center;
  padding: 0 16px;

  strong {
    color: var(--text-body);
    font-weight: 600;
  }
`;

/* ── Component ────────────────────────────────────────────────────── */
const features = [
  'Covers material defects & installation errors',
  'Indoor concrete floors prepared by Next Level',
  'Fully transferable if you sell your home',
  'Backed by years of proven installations',
];

const Warranty = () => {
  const [headerRef, headerVisible] = useScrollReveal();
  const [textRef, textVisible] = useScrollReveal();
  const [badgeRef, badgeVisible] = useScrollReveal();

  return (
    <Section>
      <ConcreteTexture opacity={0.04} />
      <BgRing size={520} aria-hidden="true" />
      <Inner>
        <div ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>Our Promise</SectionLabel>
          <SectionTitle>Lifetime Warranty</SectionTitle>
        </div>

        <Layout>
          <TextSide ref={textRef}>
            <div className={`reveal ${textVisible ? 'visible' : ''}`}>
              <WarrantyText>
                We're so confident in the quality and durability of our epoxy flooring system that we offer a <strong style={{ color: 'var(--text-hi)' }}>lifetime warranty</strong> on every floor we install<Asterisk>*</Asterisk>. When you choose Next Level, you're not just getting a beautiful floor — you're getting complete peace of mind.
              </WarrantyText>
            </div>
            <div className={`reveal ${textVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
              <FootnoteText>
                <Asterisk>*</Asterisk> The warranty applies only to <strong>indoor concrete floors</strong> that Next Level has prepared and installed. Material defects and installation errors on those surfaces are covered 100%. Application on wood, tile, experimental, or otherwise unapproved substrates is not covered, and Next Level is not responsible for coating failure on surfaces we did not prepare.
              </FootnoteText>
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
              <GlossSweep active={badgeVisible} />
              <BadgeWord>Next Level</BadgeWord>
              <BadgeBig>Lifetime<br />Warranty</BadgeBig>
              <BadgeStar>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--resin-hot)" stroke="var(--resin-hot)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
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

        <SlipDisclaimer className={`reveal ${textVisible ? 'visible' : ''}`}>
          Our standard epoxy coatings are <strong>not</strong> slip-resistant or anti-slip. Epoxy surfaces can become slippery when wet. A slip-resistant additive is available as an optional upgrade and must be specifically purchased and documented on your quote. Unless you have purchased and received a product explicitly sold with a slip-resistant guarantee, no anti-slip claim is being made and Next Level is not liable for slip-related incidents.
        </SlipDisclaimer>
      </Inner>
    </Section>
  );
};

export default Warranty;
