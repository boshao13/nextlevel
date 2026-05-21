import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const Section = styled.section`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background: var(--bg);
`;

const Inner = styled.div`
  max-width: 560px;
  text-align: center;
`;

// Decorative gold flake accent — a small scatter of flecks nodding to the
// flake-epoxy work. Purely visual; hidden from assistive tech.
const Flakes = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 6px;

  span {
    display: block;
    border-radius: 50%;
    background: var(--accent);
  }
  span:nth-child(1) { width: 8px;  height: 8px;  opacity: 0.55; }
  span:nth-child(2) { width: 14px; height: 14px; }
  span:nth-child(3) { width: 6px;  height: 6px;  opacity: 0.7; }
  span:nth-child(4) { width: 11px; height: 11px; opacity: 0.85; }
  span:nth-child(5) { width: 7px;  height: 7px;  opacity: 0.5; }
`;

const BigCode = styled.div`
  font-size: clamp(7rem, 22vw, 12rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--primary);
`;

const Headline = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 800;
  color: var(--text);
  margin: 18px 0 10px;
`;

const Subtext = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-mid);
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
  background: var(--accent);
  color: var(--primary-dark);
  font-weight: 700;
  text-decoration: none;
  border-radius: var(--radius-full);
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const SecondaryBtn = styled(Link)`
  display: inline-block;
  padding: 14px 30px;
  background: transparent;
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
  border: 2px solid var(--primary);
  border-radius: var(--radius-full);
  transition: background var(--transition), color var(--transition);

  &:hover {
    background: var(--primary);
    color: var(--white);
  }
`;

/**
 * Branded 404 page. Renders inside PublicLayout (Header/Footer/sticky call
 * button already wrap it). The "404" is a decorative div, not a heading, so
 * the witty <h1> is the page's only level-1 heading.
 */
const NotFound = () => (
  <Section>
    <Helmet>
      <title>Page Not Found | Next Level Epoxy</title>
      <meta name="robots" content="noindex,follow" />
    </Helmet>
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
        <PrimaryBtn to="/" state={{ scrollToContact: true }}>
          Get a Free Quote
        </PrimaryBtn>
        <SecondaryBtn to="/">Back to Home</SecondaryBtn>
      </ButtonRow>
    </Inner>
  </Section>
);

export default NotFound;
