// /blog/[slug] — single post (spec: 2026-07-27-seo-blog-design.md).
// FULLY runtime-ISR: generateStaticParams() is [] because the build box has
// no DB/API — no post page is prerendered at build. Unknown slugs render on
// demand (dynamicParams default), get cached, and revalidate hourly.
import { notFound } from 'next/navigation';
import BlogPost from '../../../src/BlogPost';
import { pageMetadata, SITE } from '../../../src/seo';
import { jsonLdString } from '../../../src/structuredData';

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

// Slug is interpolated into the loopback API URL — hard-restrict its alphabet
// so a hostile path segment can never traverse the URL space.
function cleanSlug(raw) {
  const slug = String(raw || '').toLowerCase();
  return /^[a-z0-9-]{1,191}$/.test(slug) ? slug : null;
}

// Returns the post row, null for a real 404 (missing/unpublished), and THROWS
// on API/network failure — a down API must surface as a 500 (never cached),
// not get memoized as a not-found page for a post that exists.
async function getPost(rawSlug) {
  const slug = cleanSlug(rawSlug);
  if (!slug) return null;
  const res = await fetch(`http://127.0.0.1:4242/api/blog/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blog API responded ${res.status} for slug "${slug}"`);
  return res.json();
}

// Meta title ≤60 chars: append " | Next Level Epoxy" when it fits, otherwise
// the bare post title (word-trimmed under 60 as a last resort).
const TITLE_SUFFIX = ' | Next Level Epoxy';
function metaTitle(title) {
  const t = String(title || '').trim();
  if (t.length + TITLE_SUFFIX.length <= 60) return `${t}${TITLE_SUFFIX}`;
  if (t.length <= 60) return t;
  return `${t.slice(0, 57).replace(/\s+\S*$/, '')}…`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug); // deduped with the page render's fetch
  if (!post) {
    // Page render calls notFound(); keep the 404 shell out of the index.
    return { title: `Post Not Found${TITLE_SUFFIX}`, robots: { index: false } };
  }
  return pageMetadata({
    title: metaTitle(post.title),
    description: post.description,
    path: `/blog/${post.slug}`,
  });
}

// BlogPosting JSON-LD — author/publisher reference the site-wide LocalBusiness
// @id rendered by the root layout's BUSINESS_GRAPH (do not inline a second one).
function postSchema(post) {
  const url = `${SITE}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: post.title,
    description: post.description,
    image: `${SITE}${post.hero_image}`,
    datePublished: post.published_at,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
    publisher: { '@id': 'https://www.nextlevelepoxynm.com/#business' },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params; // Next 16: params is async
  const post = await getPost(slug);
  if (!post) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(postSchema(post)) }}
      />
      <BlogPost post={post} />
    </>
  );
}
