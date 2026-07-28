const express = require('express');
const pool = require('../db/pool');

// Public read-only blog API (spec: 2026-07-27-seo-blog-design.md).
// Consumed by the Next.js ISR pages (app/blog/*) and the sitemap hook — both
// call over loopback — plus anyone on the public internet via nginx /api.
// No admin CRUD in v1: posts come from seeds or the weekly generator.
module.exports = function (blogLimiter) {
  const router = express.Router();

  // GET / — published posts, newest first. List fields only (body_html is
  // per-post; keeps the index + sitemap payload small).
  router.get('/', blogLimiter, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT slug, title, description, hero_image, topic_kind, published_at
           FROM posts
          WHERE status = 'published'
          ORDER BY published_at DESC`
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:slug — full row (incl. body_html). 404 JSON for missing OR drafts —
  // a draft must be indistinguishable from a nonexistent post publicly.
  router.get('/:slug', blogLimiter, async (req, res) => {
    try {
      const [[post]] = await pool.query(
        "SELECT * FROM posts WHERE slug = ? AND status = 'published'",
        [req.params.slug]
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (err) {
      console.error('Error fetching blog post:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
