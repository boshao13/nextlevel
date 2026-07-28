'use client';

// Blog index — card grid over the posts the server page fetched from the
// Express API. Visual system matches LocationPage.jsx (dark + resin palette).
import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { FiPhone, FiArrowRight, FiBookOpen } from 'react-icons/fi';
import { trackPhoneClick } from './lib/analytics';

/* ── Styled ──────────────────────────────────────────────────────── */

const Section = styled.section`
  padding: 120px 24px 80px;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);

  @media (max-width: 768px) {
    padding: 100px 16px 60px;
  }
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Crumbs = styled.nav`
  font-size: 0.85rem;
  color: var(--text-body);
  margin-bottom: 16px;

  a { color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
  a:hover { color: var(--resin-hot); }
  span { color: var(--text-dim); }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--resin);
  font-weight: 700;
  font-size: var(--fs-eyebrow);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const H1 = styled.h1`
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text-hi);
  margin: 0 0 18px;
`;

const Lede = styled.p`
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-body);
  max-width: 720px;
  margin: 0 0 48px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(240, 165, 0, 0.35);
    transform: translateY(-3px);
    box-shadow: var(--shadow-dk-md);
  }
`;

const CardImg = styled.img`
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  border-bottom: 1px solid var(--line);
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px 22px 22px;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--text-dim);
  margin-bottom: 10px;
`;

const Kind = styled.span`
  color: var(--resin);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const CardTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--text-hi);
  margin: 0 0 10px;
  letter-spacing: -0.01em;
`;

const CardDesc = styled.p`
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--text-body);
  margin: 0 0 16px;
  flex: 1;
`;

const ReadMore = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--resin-hot);
  font-weight: 700;
  font-size: 0.9rem;
`;

const Empty = styled.div`
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: var(--shadow-dk-md);

  h2 {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--text-hi);
    margin: 0 0 12px;
  }

  p {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-body);
    max-width: 520px;
    margin: 0 auto 24px;
  }
`;

const PrimaryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--resin-grad);
  color: #14110a;
  padding: 14px 24px;
  border-radius: 9999px;
  font-weight: 700;
  text-decoration: none;
  transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
  }
`;

/* ── Component ────────────────────────────────────────────────────── */

const KIND_LABEL = { local: 'Local', informational: 'Guide' };

// Explicit options + timeZone make server render and client hydration agree
// (site policy: dates always display in America/Denver).
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const BlogIndex = ({ posts }) => (
  <Section>
    <Inner>
      <Crumbs>
        <Link href="/">Home</Link> <span>›</span> Blog
      </Crumbs>

      <Eyebrow>
        <FiBookOpen size={12} />
        Tips &amp; Guides
      </Eyebrow>

      <H1>Epoxy Flooring Blog</H1>

      <Lede>
        Straight answers from Bo — what different coating systems actually are,
        what drives cost, and how to get the most out of a concrete floor in
        Albuquerque, Santa Fe, and Rio Rancho.
      </Lede>

      {posts.length === 0 ? (
        <Empty>
          <h2>New articles are on the way</h2>
          <p>
            We&apos;re loading up guides on epoxy and polyaspartic floors right
            now. In the meantime, the fastest way to get answers about your
            floor is to call — quotes are always free.
          </p>
          <PrimaryBtn href="tel:5053524674" onClick={() => trackPhoneClick('blog_index_empty')}>
            <FiPhone size={16} />
            Call 505-352-4674
          </PrimaryBtn>
        </Empty>
      ) : (
        <CardGrid>
          {posts.map((post) => (
            <Card key={post.slug} href={`/blog/${post.slug}`}>
              <CardImg src={post.hero_image} alt={post.title} loading="lazy" />
              <CardBody>
                <CardMeta>
                  <Kind>{KIND_LABEL[post.topic_kind] || 'Guide'}</Kind>
                  <span>{formatDate(post.published_at)}</span>
                </CardMeta>
                <CardTitle>{post.title}</CardTitle>
                <CardDesc>{post.description}</CardDesc>
                <ReadMore>
                  Read article <FiArrowRight size={15} />
                </ReadMore>
              </CardBody>
            </Card>
          ))}
        </CardGrid>
      )}
    </Inner>
  </Section>
);

export default BlogIndex;
