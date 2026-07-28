// /blog — SEO blog index (spec: 2026-07-27-seo-blog-design.md).
// ISR, revalidate hourly. Posts come from the Express API over loopback at
// render time; the build box has no DB/API, so the build-time render takes
// the catch → empty-state path and the first prod revalidation fills it in.
import BlogIndex from '../../src/BlogIndex';
import { pageMetadata } from '../../src/seo';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'Epoxy Flooring Blog — Albuquerque Tips & Guides | Next Level Epoxy',
  description:
    'Straight answers about epoxy and polyaspartic floors from Bo at Next Level — cost factors, coating comparisons, and prep guides for Albuquerque-area concrete.',
  path: '/blog',
});

async function getPosts() {
  try {
    const res = await fetch('http://127.0.0.1:4242/api/blog', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const posts = await res.json();
    return Array.isArray(posts) ? posts : [];
  } catch (err) {
    // API down (build box, Express restart) — render the graceful empty state.
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <BlogIndex posts={posts} />;
}
