import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import COLLECTIONS from './flakeCatalog';
import SwatchModal from './components/SwatchModal';

/* ── Signature colors (in stock, ready to install) ───────────────── */
const SIGNATURE_FILENAMES = new Set([
  'coyote', 'bambi', 'gravel', 'loon',
  'nightfall', 'citrine', 'tidal-wave', 'wombat',
]);

/* ── Image resolution (legacy flat folder + per-collection folders) ─ */
const flakeCtx = require.context('./images/flakes', false, /\.jpg$/);
const torginolCtx = require.context('./images/torginol', true, /\.jpg$/);

const resolveImg = (file) => {
  try {
    if (file.startsWith('flakes/')) return flakeCtx('./' + file.slice('flakes/'.length));
    if (file.startsWith('torginol/')) return torginolCtx('./' + file.slice('torginol/'.length));
  } catch (e) {
    return null;
  }
  return null;
};

const slugOf = (file) => file.split('/').pop().replace('.jpg', '');
const isInStock = (item) => SIGNATURE_FILENAMES.has(slugOf(item.file));

/* Collections we don't present (catalog data is kept for SKU lookups) */
const EXCLUDED_COLLECTIONS = new Set(['solid-colors', 'signature']);

/* Pre-resolve everything once */
const CATALOG = COLLECTIONS
  .filter((c) => !EXCLUDED_COLLECTIONS.has(c.key))
  .map((c) => ({
    ...c,
    items: c.items
      .map((it) => ({ ...it, img: resolveImg(it.file), inStock: isInStock(it) }))
      .filter((it) => it.img),
  }));

/* In-stock section is built straight from the stocked filenames so it never
   depends on which collections are displayed. */
const inStockItems = [...SIGNATURE_FILENAMES].map((slug) => {
  let sku = '';
  let collection = '';
  COLLECTIONS.forEach((c) => c.items.forEach((it) => {
    if (slugOf(it.file) === slug && !sku) { sku = it.sku; collection = c.title; }
  }));
  const name = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { name, sku, collection: collection || 'In Stock', file: `flakes/${slug}.jpg`, img: resolveImg(`flakes/${slug}.jpg`), inStock: true };
}).filter((it) => it.img).sort((a, b) => a.name.localeCompare(b.name));

const TOTAL_COUNT = CATALOG.reduce((n, c) => n + c.items.length, 0);

/* ── Styled Components ────────────────────────────────────────────── */
const Page = styled.div`
  min-height: 100vh;
  background: var(--bg0);
`;

const HeroBanner = styled.div`
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  border-bottom: 1px solid var(--line);
  padding: 140px 24px 64px;
  text-align: center;
  color: var(--text-hi);
`;

const HeroTitle = styled.h1`
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
`;

const HeroSubtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-body);
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.7;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-dim);
  text-decoration: none;
  transition: color var(--transition);

  &:hover {
    color: var(--resin-hot);
  }
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 100px;
`;

/* Sticky toolbar: search + jump chips */
const Toolbar = styled.div`
  position: sticky;
  top: 76px;
  z-index: 20;
  background: rgba(12, 14, 17, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    top: 64px;
  }
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  padding: 11px 18px;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-full);
  font-size: 0.95rem;
  font-family: inherit;
  width: 280px;
  background: var(--bg0);
  color: var(--text-hi);
  transition: border-color var(--transition), box-shadow var(--transition);

  &:focus {
    outline: none;
    border-color: var(--resin);
    box-shadow: 0 0 0 3px rgba(240, 165, 0, 0.14);
  }

  &::placeholder {
    color: var(--text-dim);
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Count = styled.p`
  font-size: 0.88rem;
  color: var(--text-dim);
  font-weight: 500;
  white-space: nowrap;
`;

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--line-strong);
    border-radius: 2px;
  }
`;

const Chip = styled.a`
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-body);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition), background var(--transition);

  &:hover {
    color: #14110a;
    background: var(--resin);
    border-color: var(--resin);
  }
`;

const Section = styled.section`
  margin-bottom: 56px;
  scroll-margin-top: 170px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-hi);
`;

const SectionCount = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dim);
`;

const InStockBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  color: #4ade80;
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

const SectionNote = styled.p`
  font-size: 0.92rem;
  color: var(--text-body);
  line-height: 1.7;
  margin-bottom: 24px;
  max-width: 720px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const Card = styled.button`
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 0;
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(240, 165, 0, 0.4);
    box-shadow: var(--shadow-dk-md);
  }
`;

const SwatchImg = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
`;

const CardLabel = styled.p`
  padding: 10px 12px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-hi);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    flex-shrink: 0;
  }
`;

const UvNote = styled.p`
  font-size: 0.92rem;
  color: var(--text-dim);
  margin-bottom: 40px;

  a {
    color: var(--resin-hot);
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const NoResults = styled.p`
  text-align: center;
  font-size: 1.05rem;
  color: var(--text-dim);
  padding: 60px 0;
`;

/* ── Component ────────────────────────────────────────────────────── */
const AllColors = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const close = useCallback(() => setSelected(null), []);

  const q = search.trim().toLowerCase();

  const filteredCatalog = useMemo(() => {
    if (!q) return CATALOG;
    return CATALOG.map((c) => ({
      ...c,
      items: c.items.filter((it) => it.name.toLowerCase().includes(q) || (it.sku || '').toLowerCase().includes(q)),
    })).filter((c) => c.items.length > 0);
  }, [q]);

  const filteredInStock = useMemo(() => {
    if (!q) return inStockItems;
    return inStockItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [q]);

  const shownCount = filteredCatalog.reduce((n, c) => n + c.items.length, 0);

  return (
    <Page>
      <Helmet>
        <title>Epoxy &amp; Polyaspartic Floor Colors | Custom Flake Systems NM</title>
        <meta name="description" content="Browse epoxy and polyaspartic floor color options for garages, basements, and commercial spaces in Albuquerque, Santa Fe, and Rio Rancho NM. Custom flake systems." />
        <link rel="canonical" href="https://www.nextlevelepoxynm.com/colors" />
        <meta property="og:title" content="Epoxy & Polyaspartic Floor Colors | Custom Flake Systems NM" />
        <meta property="og:description" content="Browse epoxy and polyaspartic floor color options for garages, basements, and commercial spaces in NM." />
        <meta property="og:url" content="https://www.nextlevelepoxynm.com/colors" />
      </Helmet>
      <HeroBanner>
        <BackLink to="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </BackLink>
        <HeroTitle>All Flake Colors</HeroTitle>
        <HeroSubtitle>
          The complete Torginol® flake line — every collection, every color. Not sure which to pick? We bring samples to every consultation.
        </HeroSubtitle>
      </HeroBanner>

      <Content>
        <Toolbar>
          <ToolbarRow>
            <SearchInput
              type="text"
              placeholder="Search colors or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Count>{q ? `${shownCount} of ${TOTAL_COUNT}` : TOTAL_COUNT} colors</Count>
          </ToolbarRow>
          <ChipRow>
            {CATALOG.map((c) => (
              <Chip key={c.key} href={`#${c.key}`}>{c.title}</Chip>
            ))}
          </ChipRow>
        </Toolbar>

        {filteredInStock.length > 0 && (
          <Section id="in-stock">
            <SectionHeader>
              <SectionTitle>Our Signature Colors</SectionTitle>
              <InStockBadge>In Stock</InStockBadge>
            </SectionHeader>
            <SectionNote>
              We carry these colors in stock and they are available to install immediately.
              All other colors are available to order and subject to shipping times.
            </SectionNote>
            <Grid>
              {filteredInStock.map((it) => (
                <Card key={`stock-${it.file}`} onClick={() => setSelected(it)} aria-label={`View ${it.name}`}>
                  <SwatchImg src={it.img} alt={it.name} loading="lazy" decoding="async" />
                  <CardLabel><span aria-hidden="true" />{it.name}</CardLabel>
                </Card>
              ))}
            </Grid>
          </Section>
        )}

        <UvNote>
          Looking for outdoor flake? Our UV-stable patio line lives on the{' '}
          <Link to="/patios">Patios page</Link>.
        </UvNote>

        {filteredCatalog.length === 0 ? (
          <NoResults>No colors match "{search}"</NoResults>
        ) : (
          filteredCatalog.map((c) => (
            <Section key={c.key} id={c.key}>
              <SectionHeader>
                <SectionTitle>{c.title}</SectionTitle>
                <SectionCount>{c.items.length} color{c.items.length !== 1 ? 's' : ''}</SectionCount>
              </SectionHeader>
              <SectionNote>{c.blurb}</SectionNote>
              <Grid>
                {c.items.map((it) => (
                  <Card
                    key={`${c.key}-${it.file}`}
                    onClick={() => setSelected({ ...it, collection: c.title })}
                    aria-label={`View ${it.name}`}
                  >
                    <SwatchImg src={it.img} alt={it.name} loading="lazy" decoding="async" />
                    <CardLabel>
                      {it.inStock && <span aria-hidden="true" />}
                      {it.name}
                    </CardLabel>
                  </Card>
                ))}
              </Grid>
            </Section>
          ))
        )}
      </Content>

      {selected && <SwatchModal item={selected} onClose={close} />}
    </Page>
  );
};

export default AllColors;
