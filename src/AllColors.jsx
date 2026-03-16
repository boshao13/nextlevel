import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

/* ── Signature colors (in stock, ready to install) ───────────────── */
const SIGNATURE_FILENAMES = new Set([
  'coyote', 'creekbed', 'gravel', 'loon',
  'nightfall', 'tidal-wave', 'thyme', 'wombat',
]);

/* ── Dynamically import all flake images ─────────────────────────── */
const flakeContext = require.context('./images/flakes', false, /\.jpg$/);
const allFlakes = flakeContext.keys().map((key) => {
  const filename = key.replace('./', '').replace('.jpg', '');
  const name = filename
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { name, filename, img: flakeContext(key), signature: SIGNATURE_FILENAMES.has(filename) };
}).sort((a, b) => a.name.localeCompare(b.name));

const signatureFlakes = allFlakes.filter((f) => f.signature);
const otherFlakes = allFlakes.filter((f) => !f.signature);

/* ── Styled Components ────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

const HeroBanner = styled.div`
  background: linear-gradient(160deg, #0a3356 0%, var(--primary) 40%, #0d3f6e 100%);
  padding: 140px 24px 80px;
  text-align: center;
  color: white;
`;

const HeroTitle = styled.h1`
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 800;
  margin-bottom: 16px;
`;

const HeroSubtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 100px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 36px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  padding: 12px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: 0.95rem;
  width: 280px;
  background: white;
  color: var(--text);
  transition: border-color var(--transition), box-shadow var(--transition);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
  }

  &::placeholder {
    color: var(--text-light);
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Count = styled.p`
  font-size: 0.88rem;
  color: var(--text-light);
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const Card = styled.div`
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
`;

const SwatchImg = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
`;

const CardLabel = styled.p`
  padding: 10px 14px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  text-align: center;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color var(--transition);

  &:hover {
    color: white;
  }
`;

const SignatureSection = styled.div`
  margin-bottom: 64px;
`;

const SignatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
`;

const SignatureTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text);
`;

const InStockBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
  }
`;

const SignatureNote = styled.p`
  font-size: 0.95rem;
  color: var(--text-mid);
  line-height: 1.7;
  margin-bottom: 28px;
`;

const SignatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border);
  margin-bottom: 48px;
`;

const AllColorsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
`;

const AllColorsTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text);
`;

const ShippingNote = styled.p`
  font-size: 0.92rem;
  color: var(--text-light);
  margin-bottom: 28px;
  font-style: italic;
`;

const NoResults = styled.p`
  text-align: center;
  font-size: 1.05rem;
  color: var(--text-light);
  padding: 60px 0;
  grid-column: 1 / -1;
`;

/* ── Component ────────────────────────────────────────────────────── */
const AllColors = () => {
  const [search, setSearch] = useState('');

  const filteredOther = useMemo(() => {
    if (!search.trim()) return otherFlakes;
    const q = search.toLowerCase();
    return otherFlakes.filter((f) => f.name.toLowerCase().includes(q));
  }, [search]);

  const filteredSignature = useMemo(() => {
    if (!search.trim()) return signatureFlakes;
    const q = search.toLowerCase();
    return signatureFlakes.filter((f) => f.name.toLowerCase().includes(q));
  }, [search]);

  const totalCount = filteredSignature.length + filteredOther.length;

  return (
    <Page>
      <HeroBanner>
        <BackLink to="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </BackLink>
        <HeroTitle>All Flake Colors</HeroTitle>
        <HeroSubtitle>
          Browse our full selection of decorative flake colors. Not sure which to pick? We bring samples to every consultation.
        </HeroSubtitle>
      </HeroBanner>

      <Content>
        <Toolbar>
          <SearchInput
            type="text"
            placeholder="Search colors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Count>{totalCount} color{totalCount !== 1 ? 's' : ''}</Count>
        </Toolbar>

        {filteredSignature.length > 0 && (
          <SignatureSection>
            <SignatureHeader>
              <SignatureTitle>Our Signature Colors</SignatureTitle>
              <InStockBadge>In Stock</InStockBadge>
            </SignatureHeader>
            <SignatureNote>
              We carry these colors in stock and they are available to install immediately.
            </SignatureNote>
            <SignatureGrid>
              {filteredSignature.map((f) => (
                <Card key={f.filename}>
                  <SwatchImg src={f.img} alt={f.name} loading="lazy" />
                  <CardLabel>{f.name}</CardLabel>
                </Card>
              ))}
            </SignatureGrid>
          </SignatureSection>
        )}

        <Divider />

        <AllColorsHeader>
          <AllColorsTitle>All Colors</AllColorsTitle>
        </AllColorsHeader>
        <ShippingNote>All other colors are available to order and subject to shipping times.</ShippingNote>

        <Grid>
          {filteredOther.length > 0 ? (
            filteredOther.map((f) => (
              <Card key={f.filename}>
                <SwatchImg src={f.img} alt={f.name} loading="lazy" />
                <CardLabel>{f.name}</CardLabel>
              </Card>
            ))
          ) : (
            <NoResults>No colors match "{search}"</NoResults>
          )}
        </Grid>
      </Content>
    </Page>
  );
};

export default AllColors;
