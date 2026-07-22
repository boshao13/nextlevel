'use client';

// src/PolishedConcreteDivision.jsx — bridge page to our sister company, Next Level Polished Concrete
import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const PC_SITE = 'https://nextlevelpolishedconcrete.com';

const Wrap = styled.section`
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7rem 1.5rem 5rem;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  color: var(--text-body);
`;

const Card = styled.div`
  max-width: 720px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dk-sm);
  padding: 3rem 2rem;
`;

const Kicker = styled.p`
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--resin);
  margin: 0 0 1rem;
`;

const Heading = styled.h1`
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
  margin: 0 0 1.25rem;
  color: var(--text-hi);
  letter-spacing: -0.02em;
`;

const Body = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-body);
  margin: 0 auto 2.5rem;
  max-width: 560px;

  strong {
    color: var(--text-hi);
  }
`;

const CTA = styled.a`
  display: inline-block;
  background: var(--resin-grad);
  color: #14110a;
  font-weight: 800;
  font-size: 1.05rem;
  padding: 1rem 2.25rem;
  border-radius: 999px;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
  box-shadow: 0 4px 22px rgba(240, 165, 0, 0.3);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
  }
`;

const Back = styled(Link)`
  display: inline-block;
  margin-top: 1.75rem;
  color: var(--text-dim);
  font-size: 0.95rem;
  text-decoration: none;

  &:hover { color: var(--resin-hot); }
`;

const PolishedConcreteDivision = () => (
  <>
    <Wrap>
      <Card>
        <Kicker>A Next Level Company</Kicker>
        <Heading>Looking for Polished Concrete?</Heading>
        <Body>
          An epoxy coating isn't the right fit for every floor. For mechanically
          polished, dyed, stained, and grind-and-seal concrete &mdash; that
          showroom shine straight from the slab &mdash; our sister company{' '}
          <strong>Next Level Polished Concrete</strong> has you covered. Same
          crews, same standards, same extremely high-quality work across
          Albuquerque, Santa Fe, and Rio Rancho.
        </Body>
        <CTA href={PC_SITE} target="_blank" rel="noopener noreferrer">
          Visit Next Level Polished Concrete →
        </CTA>
        <div>
          <Back href="/">← Back to Next Level Epoxy</Back>
        </div>
      </Card>
    </Wrap>
  </>
);

export default PolishedConcreteDivision;
