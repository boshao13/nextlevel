'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const Section = styled.section`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background: var(--bg0);
`;

const Inner = styled.div`
  max-width: 560px;
  text-align: center;
`;

// Decorative flake accent — a small scatter of flecks nodding to the
// flake-epoxy work, in the flake-blend palette. Purely visual; hidden
// from assistive tech.
const Flakes = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 6px;

  span {
    display: block;
    border-radius: 50%;
  }
  span:nth-child(1) { width: 8px;  height: 8px;  background: #b99a6b; opacity: 0.75; }
  span:nth-child(2) { width: 14px; height: 14px; background: #f0a500; }
  span:nth-child(3) { width: 6px;  height: 6px;  background: #8f9dab; opacity: 0.8; }
  span:nth-child(4) { width: 11px; height: 11px; background: #46618a; opacity: 0.9; }
  span:nth-child(5) { width: 7px;  height: 7px;  background: #71767c; opacity: 0.7; }
`;

const BigCode = styled.div`
  font-size: clamp(7rem, 22vw, 12rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  /* Graphite fill with a subtle amber outline — falls back to solid
     graphite where text-stroke is unsupported. */
  color: var(--surface-2);
  -webkit-text-stroke: 2px rgba(240, 165, 0, 0.5);
`;

const Headline = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 800;
  color: var(--text-hi);
  margin: 18px 0 10px;
`;

const Subtext = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-body);
  margin: 0 auto 32px;
  max-width: 420px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PrimaryBtn = styled(Link)`
  display: inline-block;
  padding: 14px 30px;
  background: var(--resin-grad);
  color: #14110a;
  font-weight: 700;
  text-decoration: none;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 22px rgba(240, 165, 0, 0.3);
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.42);
  }
`;

const SecondaryBtn = styled(Link)`
  display: inline-block;
  padding: 14px 30px;
  background: rgba(18, 21, 26, 0.35);
  color: var(--text-hi);
  font-weight: 700;
  text-decoration: none;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-full);
  transition: background var(--transition), border-color var(--transition), transform var(--transition);

  &:hover {
    background: var(--surface);
    border-color: rgba(240, 165, 0, 0.4);
    transform: translateY(-2px);
  }
`;

/**
 * Branded 404 page. Renders inside PublicLayout (Header/Footer/sticky call
 * button already wrap it). The "404" is a decorative div, not a heading, so
 * the witty <h1> is the page's only level-1 heading.
 */
const NotFound = () => (
  <Section>
    {/* Title comes ONLY from app/not-found.js metadata — one source, no
        duplicate head tags. The robots meta stays here deliberately to
        preserve today's exact `noindex,follow` string. */}
    <meta name="robots" content="noindex,follow" />
    <Inner>
      <Flakes aria-hidden="true">
        <span /><span /><span /><span /><span />
      </Flakes>
      <BigCode>404</BigCode>
      <Headline>This page slipped through a crack in the concrete.</Headline>
      <Subtext>
        The page you're after moved, got resurfaced, or never existed — let's
        get you back on solid ground.
      </Subtext>
      <ButtonRow>
        <PrimaryBtn href="/#contact">
          Get a Free Quote
        </PrimaryBtn>
        <SecondaryBtn href="/">Back to Home</SecondaryBtn>
      </ButtonRow>
    </Inner>
  </Section>
);

export default NotFound;
