// src/PolishedConcreteDivision.jsx — bridge page to our sister company, Next Level Polished Concrete
import React from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const PC_SITE = 'https://nextlevelpolishedconcrete.com';

const SEO = () => (
  <Helmet>
    <title>Polished Concrete Floors — Next Level Polished Concrete (Our Sister Company)</title>
    <meta
      name="description"
      content="Want polished, dyed, stained, or grind-and-seal concrete instead of an epoxy coating? Our sister company, Next Level Polished Concrete, delivers extremely high-quality polished concrete across Albuquerque, Santa Fe & Rio Rancho NM."
    />
    <meta name="keywords" content="polished concrete Albuquerque, dyed concrete Santa Fe, stained concrete Rio Rancho, grind and seal NM, Next Level Polished Concrete" />
    <link rel="canonical" href="https://www.nextlevelepoxynm.com/polished-concrete" />
    <meta property="og:title" content="Polished Concrete Floors — Next Level Polished Concrete" />
    <meta property="og:description" content="Our sister company delivers polished, dyed, stained & grind-and-seal concrete across New Mexico." />
    <meta property="og:url" content="https://www.nextlevelepoxynm.com/polished-concrete" />
    <meta property="og:type" content="website" />
  </Helmet>
);

const Wrap = styled.section`
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7rem 1.5rem 5rem;
  background: linear-gradient(160deg, #0a1f3a 0%, #0f4c81 100%);
  color: #fff;
`;

const Card = styled.div`
  max-width: 720px;
  text-align: center;
`;

const Kicker = styled.p`
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fbbf24;
  margin: 0 0 1rem;
`;

const Heading = styled.h1`
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
  margin: 0 0 1.25rem;
`;

const Body = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: #d6e2f0;
  margin: 0 auto 2.5rem;
  max-width: 560px;
`;

const CTA = styled.a`
  display: inline-block;
  background: #fbbf24;
  color: #0a1f3a;
  font-weight: 800;
  font-size: 1.05rem;
  padding: 1rem 2.25rem;
  border-radius: 999px;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 38px rgba(0, 0, 0, 0.45);
  }
`;

const Back = styled(Link)`
  display: inline-block;
  margin-top: 1.75rem;
  color: #9db8d6;
  font-size: 0.95rem;
  text-decoration: none;

  &:hover { color: #fff; }
`;

const PolishedConcreteDivision = () => (
  <>
    <SEO />
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
          <Back to="/">← Back to Next Level Epoxy</Back>
        </div>
      </Card>
    </Wrap>
  </>
);

export default PolishedConcreteDivision;
