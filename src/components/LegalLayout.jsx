'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

/* Shared layout + typography for the legal pages (/privacy, /terms). */

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg0);
`;

const Banner = styled.div`
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  border-bottom: 1px solid var(--line);
  padding: 140px 24px 56px;
  text-align: center;
`;

const Eyebrow = styled.p`
  font-size: var(--fs-eyebrow);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--resin);
  margin-bottom: 12px;
`;

const Title = styled.h1`
  font-size: clamp(1.9rem, 4vw, 2.7rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-hi);
  margin-bottom: 10px;
`;

const Effective = styled.p`
  font-size: 0.85rem;
  color: var(--text-dim);
`;

const Content = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 48px 24px 100px;
  color: var(--text-body);
  font-size: 0.95rem;
  line-height: 1.75;

  h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-hi);
    margin: 36px 0 10px;
  }

  p {
    margin-bottom: 14px;
  }

  ul {
    margin: 0 0 14px 22px;
  }

  li {
    margin-bottom: 6px;

    &::marker {
      color: var(--resin);
    }
  }

  a {
    color: var(--resin-hot);
    /* Underlined ALWAYS, not just on hover — WCAG 1.4.1 (Use of Color).
       Amber link text (#ffc940) against the body copy colour (--text-body
       #c5cdd6) is only ~1.04:1 apart, well under the 3:1 needed to tell a
       link from its surrounding text by colour alone, so the underline is
       what actually identifies it. (axe-core link-in-text-block, serious.) */
    text-decoration: underline;

    &:hover {
      color: var(--resin);
    }
  }

  blockquote {
    margin: 0 0 14px;
    padding: 14px 18px;
    background: var(--surface);
    border-left: 3px solid rgba(240, 165, 0, 0.45);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-size: 0.9rem;

    strong {
      color: var(--text-hi);
    }
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-dim);
  transition: color var(--transition);

  &:hover {
    color: var(--resin-hot);
  }
`;

const LegalLayout = ({ title, effectiveDate, children }) => (
  <Page>
    <Banner>
      <BackLink href="/">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Back to Home
      </BackLink>
      <Eyebrow>Legal</Eyebrow>
      <Title>{title}</Title>
      <Effective>Effective {effectiveDate}</Effective>
    </Banner>
    <Content>{children}</Content>
  </Page>
);

export default LegalLayout;
