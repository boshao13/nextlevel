'use client';

// Single blog post shell — renders the API's body_html inside the site's
// visual system (matches LocationPage.jsx: dark + resin palette).
//
// body_html is TRUSTED content: authored seed posts, or the generator's
// markdown→HTML converter which escapes everything it doesn't build itself
// (scripts/generate-blog-post.mjs). Nothing user-submitted ever lands here.
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
  max-width: 780px;
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
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--text-hi);
  margin: 0 0 14px;
`;

const Meta = styled.div`
  font-size: 0.88rem;
  color: var(--text-dim);
  margin-bottom: 28px;
`;

const Hero = styled.img`
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  border-radius: 14px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-dk-md);
  margin-bottom: 36px;
`;

const Article = styled.article`
  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-hi);
    margin: 36px 0 14px;
    letter-spacing: -0.01em;
  }
  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-hi);
    margin: 28px 0 12px;
  }
  p {
    font-size: 1.02rem;
    line-height: 1.8;
    color: var(--text-body);
    margin: 0 0 18px;
  }
  ul, ol {
    margin: 0 0 20px;
    padding-left: 22px;
  }
  li {
    font-size: 1.02rem;
    line-height: 1.75;
    color: var(--text-body);
    margin-bottom: 8px;

    &::marker { color: var(--resin-hot); }
  }
  strong { color: var(--text-hi); }
  a {
    color: var(--resin-hot);
    text-decoration: underline;
    text-underline-offset: 3px;

    &:hover { color: var(--resin); }
  }
`;

const CtaCard = styled.aside`
  margin-top: 48px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  padding: 32px 28px;
  box-shadow: var(--shadow-dk-md);
  text-align: center;

  h2 {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-hi);
    margin: 0 0 10px;
    letter-spacing: -0.01em;
  }

  p {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-body);
    max-width: 520px;
    margin: 0 auto 22px;
  }
`;

const CtaRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
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

const SecondaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(18, 21, 26, 0.35);
  color: var(--text-hi);
  padding: 14px 24px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid var(--line-strong);
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(240, 165, 0, 0.35);
    background: rgba(255, 255, 255, 0.04);
  }
`;

const BackRow = styled.div`
  margin-top: 32px;
  text-align: center;

  a {
    color: var(--text-dim);
    font-size: 0.9rem;
    text-decoration: none;
    transition: color 0.2s;

    &:hover { color: var(--resin-hot); }
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

const BlogPost = ({ post }) => (
  <Section>
    <Inner>
      <Crumbs>
        <Link href="/">Home</Link> <span>›</span> <Link href="/blog">Blog</Link>{' '}
        <span>›</span> {post.title}
      </Crumbs>

      <Eyebrow>
        <FiBookOpen size={12} />
        {KIND_LABEL[post.topic_kind] || 'Guide'}
      </Eyebrow>

      <H1>{post.title}</H1>

      <Meta>By Bo · Next Level Epoxy Flooring · {formatDate(post.published_at)}</Meta>

      {post.hero_image && <Hero src={post.hero_image} alt={post.title} />}

      <Article dangerouslySetInnerHTML={{ __html: post.body_html }} />

      <CtaCard>
        <h2>Wondering what this looks like on your floor?</h2>
        <p>
          Call or text me and I&apos;ll give you a straight answer — or grab a
          free quote and I&apos;ll come take a look in person. No pressure, no
          obligation.
        </p>
        <CtaRow>
          <PrimaryBtn href="tel:5053524674" onClick={() => trackPhoneClick(`blog_${post.slug}`)}>
            <FiPhone size={16} />
            Call 505-352-4674
          </PrimaryBtn>
          <SecondaryBtn href="/#contact">
            Get a Free Quote
            <FiArrowRight size={16} />
          </SecondaryBtn>
        </CtaRow>
      </CtaCard>

      <BackRow>
        <Link href="/blog">← Back to all articles</Link>
      </BackRow>
    </Inner>
  </Section>
);

export default BlogPost;
