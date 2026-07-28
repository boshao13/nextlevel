-- SEO blog schema (spec: docs/superpowers/specs/2026-07-27-seo-blog-design.md).
-- IDEMPOTENT: safe to run on every Express boot (server/db/ensure-blog.js) and
-- safe on a DB where the tables already exist. The boot runner strips comment
-- lines then splits statements on semicolons, so no statement (or comment)
-- may contain a literal semicolon.

CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  hero_image VARCHAR(255) NOT NULL DEFAULT '/images/og-image.jpg',
  body_html MEDIUMTEXT NOT NULL,
  topic_kind ENUM('local', 'informational') NOT NULL DEFAULT 'informational',
  status ENUM('published', 'draft') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_posts_status_published (status, published_at)
);

CREATE TABLE IF NOT EXISTS post_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  kind ENUM('local', 'informational') NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic backlog seed — 6 local + 6 informational. Guarded on the table being
-- EMPTY so re-running on every boot never duplicates rows and never
-- resurrects topics the generator has consumed (used_at set) or Bo deleted.
INSERT INTO post_topics (topic, kind)
SELECT t.topic, t.kind FROM (
  SELECT 'How much epoxy flooring costs in Albuquerque' AS topic, 'local' AS kind
  UNION ALL SELECT 'The best garage floor coating for the Albuquerque sun', 'local'
  UNION ALL SELECT 'When to coat the garage floor in a Rio Rancho new build', 'local'
  UNION ALL SELECT 'Santa Fe freeze-thaw cycles and what they do to concrete floors', 'local'
  UNION ALL SELECT 'Commercial kitchen floor coatings for Albuquerque restaurants', 'local'
  UNION ALL SELECT 'Patio coatings that survive New Mexico summers', 'local'
  UNION ALL SELECT 'Epoxy vs. polyaspartic floor coatings compared', 'informational'
  UNION ALL SELECT 'Flake vs. solid-color epoxy floors', 'informational'
  UNION ALL SELECT 'How long an epoxy floor actually lasts', 'informational'
  UNION ALL SELECT 'DIY epoxy kits vs. professional installation', 'informational'
  UNION ALL SELECT 'Moisture and concrete coatings, explained', 'informational'
  UNION ALL SELECT 'How to prepare for epoxy installation day', 'informational'
) t
WHERE NOT EXISTS (SELECT 1 FROM post_topics);
