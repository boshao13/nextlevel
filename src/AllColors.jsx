'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import COLLECTIONS from './flakeCatalog';
import SwatchModal from './components/SwatchModal';
import MANIFEST from './flakeImageManifest.json';

/* ── Signature colors (in stock, ready to install) ───────────────── */
const SIGNATURE_FILENAMES = new Set([
  'coyote', 'bambi', 'gravel', 'loon',
  'nightfall', 'citrine', 'tidal-wave', 'wombat',
]);

/* ── Image resolution (committed manifest replaces require.context) ─
   Keys look like 'flakes/gravel.webp' / 'torginol/garage/bean.webp'.
   Missing image → null → item dropped, exactly like the old try/catch.
   Regenerate after adding swatches (convert-webp.mjs first): npm run flakes:manifest */
const resolveImg = (file) => MANIFEST[file] || null;

/* Intrinsic square swatch size (CLS): flakes/ scans are 380×380, the
   torginol collections 400×400. Rendered size is CSS-controlled (square);
   these attributes just reserve the 1:1 box before the image loads. */
const dimOf = (file) => (file.startsWith('flakes/') ? 380 : 400);

const slugOf = (file) => file.split('/').pop().replace('.webp', '');
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
  return { name, sku, collection: collection || 'In Stock', file: `flakes/${slug}.webp`, img: resolveImg(`flakes/${slug}.webp`), inStock: true };
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

/* Category jump nav (non-floating) */
const CategoryNav = styled.nav`
  margin-bottom: 40px;
`;

const Count = styled.p`
  font-size: 0.88rem;
  color: var(--text-dim);
  font-weight: 500;
  margin-bottom: 14px;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  scroll-margin-top: 96px;
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

/* ── Component ────────────────────────────────────────────────────── */
const AllColors = () => {
  const [selected, setSelected] = useState(null);

  const close = useCallback(() => setSelected(null), []);

  return (
    <Page>
      <HeroBanner>
        <BackLink href="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </BackLink>
        <HeroTitle>All Flake Colors</HeroTitle>
        <HeroSubtitle>
          The complete Torginol® flake line — every collection, every color. Not sure which to pick? We bring samples to every consultation.
        </HeroSubtitle>
      </HeroBanner>

      <Content>
        <CategoryNav aria-label="Flake collections">
          <Count>{TOTAL_COUNT} colors across {CATALOG.length} collections</Count>
          <ChipRow>
            {CATALOG.map((c) => (
              <Chip key={c.key} href={`#${c.key}`}>{c.title}</Chip>
            ))}
          </ChipRow>
        </CategoryNav>

        {inStockItems.length > 0 && (
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
              {inStockItems.map((it) => (
                <Card key={`stock-${it.file}`} onClick={() => setSelected(it)} aria-label={`View ${it.name}`}>
                  <SwatchImg src={it.img} alt={it.name} width={dimOf(it.file)} height={dimOf(it.file)} loading="lazy" decoding="async" />
                  <CardLabel><span aria-hidden="true" />{it.name}</CardLabel>
                </Card>
              ))}
            </Grid>
          </Section>
        )}

        <UvNote>
          Looking for outdoor flake? Our UV-stable patio line lives on the{' '}
          <Link href="/patios">Patios page</Link>.
        </UvNote>

        {CATALOG.map((c) => (
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
                  <SwatchImg src={it.img} alt={it.name} width={dimOf(it.file)} height={dimOf(it.file)} loading="lazy" decoding="async" />
                  <CardLabel>
                    {it.inStock && <span aria-hidden="true" />}
                    {it.name}
                  </CardLabel>
                </Card>
              ))}
            </Grid>
          </Section>
        ))}
      </Content>

      {selected && <SwatchModal item={selected} onClose={close} />}
    </Page>
  );
};

export default AllColors;
