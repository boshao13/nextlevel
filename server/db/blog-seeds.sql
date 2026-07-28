-- SEO blog launch seeds — 3 human-reviewed posts (spec: 2026-07-27-seo-blog-design.md).
-- Written in-repo, NOT API-generated. Content rules enforced on review:
-- no street address, warranty stated ONLY as the lifetime warranty on indoor
-- concrete we prepare and install, first-person Bo voice, and no numbers or
-- claims beyond the published facts (560+ floors, one-day residential
-- installs, polyaspartic topcoats, Albuquerque / Santa Fe / Rio Rancho
-- service area, free quotes at 505-352-4674).
--
-- IDEMPOTENT: each INSERT is guarded on its slug, so re-running is a no-op.
-- Apply once after blog-schema.sql has created the tables (the Express boot
-- does that automatically):
--   mysql -h <host> -u <user> -p <db> < server/db/blog-seeds.sql
-- The file is also safe for the naive semicolon-splitting runners in this
-- repo: no statement, comment, or HTML body contains a literal semicolon.

INSERT INTO posts (slug, title, description, hero_image, body_html, topic_kind, status, published_at)
SELECT
  'how-much-does-epoxy-flooring-cost-in-albuquerque',
  'How Much Does Epoxy Flooring Cost in Albuquerque?',
  'What actually drives the price of an epoxy floor in Albuquerque — size, prep, moisture, and system choice — explained honestly by the installer himself.',
  '/images/torginol/garage/platteville.jpg',
  '<p>The first question almost everyone asks me is some version of this one. And I get it — you want a ballpark before you invite a stranger into your garage. So let me be straight with you about why I don''t publish a price list, and what actually determines what your floor will cost.</p>
<p>Anyone who hands you a firm number without seeing your concrete is guessing. I''ve installed more than 560 floors across Albuquerque, Santa Fe, and Rio Rancho, and no two slabs have ever been the same. What I can do is walk you through the things I look at when I build a quote, so that when you compare bids — mine or anyone else''s — you know exactly what you''re paying for.</p>
<h2>Square footage sets the starting point</h2>
<p>Bigger floors take more material and more time, so the total goes up with size. But here''s the part that surprises people: small jobs are not proportionally cheap. Every job carries the same fixed work — protecting your walls, hauling in equipment, grinding the slab, mixing product, coming back to finish the topcoat. That overhead gets spread across fewer square feet on a small floor, so the price per foot tends to run higher on a closet-sized project than on a big open shop.</p>
<h2>The condition of your concrete is the biggest wildcard</h2>
<p>This is the variable most homeowners never think about, and it''s usually the one that moves a quote the most. Cracks need to be chased out and filled. Pitting and spalling need repair. An old coating — garage paint, a peeling DIY kit, a glossy sealer — has to be mechanically ground off before anything new can bond. Oil spots need extra attention, because no coating on earth sticks to contaminated concrete. None of this is padding. Skipping it is how floors fail, and fixing a failed floor costs far more than prepping it right the first time.</p>
<h2>Moisture matters, even in the desert</h2>
<p>Albuquerque is dry, but slabs are not always. Concrete wicks ground moisture up from below, and a slab beside heavy irrigation or poor drainage can carry more vapor than you''d expect. Moisture pushing up under a coating is one of the classic ways an install fails, so it has to be checked — and dealt with when it shows up — before coating day. It affects the quote because it changes the work, not because it pads the bill.</p>
<h2>The system you choose</h2>
<p>A solid-color floor and a full decorative flake floor are different amounts of labor and material. Flake systems get broadcast by hand, scraped smooth, and locked under a clear topcoat. We finish our floors with polyaspartic topcoats, which hold their color and take daily abuse — that''s a deliberate choice, and the topcoat is the last place to save money. When I quote, I''ll lay the options side by side so the difference is a decision you make, not a mystery on an invoice.</p>
<h2>So what does a quote from me look like?</h2>
<p>It''s free, and it happens at your house. I come out, measure the actual floor, check the condition of the slab, and talk through what you want the space to do. You get a real number for your real floor — not a teaser rate that grows once the grinder comes off the truck. Most residential floors go in in one day, and indoor concrete we prepare and install carries our lifetime warranty, so the number I give you is for a floor I fully intend to stand behind.</p>
<p>If you''re ready for the honest version of the answer, call or text me at <a href="tel:5053524674">505-352-4674</a> or send the free <a href="/#contact">quote form</a> and I''ll come take a look. No pressure, no games — just a straight number for your actual floor.</p>',
  'local',
  'published',
  '2026-07-27 09:00:00'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'how-much-does-epoxy-flooring-cost-in-albuquerque');

INSERT INTO posts (slug, title, description, hero_image, body_html, topic_kind, status, published_at)
SELECT
  'epoxy-vs-polyaspartic-what-we-actually-install-and-why',
  'Epoxy vs. Polyaspartic: What We Actually Install and Why',
  'Epoxy and polyaspartic are not rivals. Bo explains what each material does best and why our garage floors use both — an epoxy body under a UV-stable topcoat.',
  '/images/epoxydiagram.jpg',
  '<p>Somewhere along the way, epoxy versus polyaspartic turned into a sales pitch, with companies planting a flag on one side and trash-talking the other. I''ve installed more than 560 floors around Albuquerque, Santa Fe, and Rio Rancho, so let me tell you how I actually see it: these two materials aren''t rivals. On a well-built floor, they''re teammates.</p>
<h2>What epoxy really is</h2>
<p>Epoxy is a resin that cures into a hard, dense plastic and bonds tenaciously to properly prepared concrete. It builds thickness beautifully, which is exactly what you want in the body of a floor — it fills texture, carries decorative flake, and creates that thick, glassy foundation people picture when they imagine a coated garage. Its weaknesses are just as real: straight epoxy cures slowly, and sunlight will yellow it over time. Neither of those is a scandal. They''re properties you design around.</p>
<h2>What polyaspartic really is</h2>
<p>Polyaspartic is a newer chemistry that cures fast, stays flexible enough to ride out temperature swings, shrugs off abrasion, and — this is the big one — holds its color in sunlight. It costs more as a material, and that fast cure makes it far less forgiving to apply, which is why it rewards installers who work with it constantly. Used as a topcoat, it is outstanding. And that is exactly how we use it.</p>
<h2>Why we build floors with both</h2>
<p>Here''s the honest engineering: put each chemistry where it''s strongest. The epoxy does the structural work down low, bonded into concrete that has been properly ground and repaired. The polyaspartic goes on top, where the sunlight, the hot tires, the dropped tools, and the road grime actually land. Polyaspartic topcoats are also a big part of how most of our residential installs are finished in one day — the topcoat cures fast enough that your garage comes back to you quickly instead of sitting taped off while the clock runs.</p>
<h2>When someone tells you different</h2>
<p>You''ll meet companies selling all-polyaspartic systems as the only modern answer, and you''ll meet bargain bids running cheap epoxy top to bottom. I won''t claim every one of those floors fails. But when a coated floor does fail, there''s usually a pattern, and it''s rarely the brand of resin. An all-epoxy floor in a sun-washed garage will amber near the door. A rushed coat on badly prepped concrete will peel no matter whose name is on the bucket. The chemistry debate gets the attention, while the real difference is made — or lost — before any resin leaves the pail.</p>
<h2>What to ask whoever bids your floor</h2>
<p>You don''t need to become a chemist to protect yourself. Ask a few plain questions of anyone quoting your garage. What is each layer of the system, by name? What prep is included — grinding, crack repair, moisture check — and what happens if the slab needs more of it? And is the topcoat UV stable? Listen for specifics. An installer who knows their system will answer without a pause, and an installer who answers every question with a brand name and a shrug is telling you something too.</p>
<h2>The part that matters more than chemistry</h2>
<p>Whatever goes in the bucket, the floor lives or dies on preparation. Grinding the slab open, repairing cracks, and getting the surface genuinely clean is most of the work and most of the outcome. It''s also why I''m comfortable offering a lifetime warranty on indoor concrete we prepare and install — I know what''s under our coatings, because we did the prep ourselves.</p>
<p>If you''re weighing systems for your own garage, I''m happy to walk through it on your actual floor instead of a brochure. Call or text <a href="tel:5053524674">505-352-4674</a> or use the free <a href="/#contact">quote form</a> and you''ll get a straight recommendation, free, with zero obligation.</p>',
  'informational',
  'published',
  '2026-07-27 10:00:00'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'epoxy-vs-polyaspartic-what-we-actually-install-and-why');

INSERT INTO posts (slug, title, description, hero_image, body_html, topic_kind, status, published_at)
SELECT
  'will-an-epoxy-garage-floor-survive-albuquerque-sun-and-winter',
  'Will an Epoxy Garage Floor Survive Albuquerque Sun and Winter?',
  'High-desert sun, freezing nights, hot tires — here is how a properly prepped and coated garage floor stands up to Albuquerque weather, season by season.',
  '/images/torginol/garage/yellow-jacket.jpg',
  '<p>The high desert is a beautiful place to live and a punishing place to be a floor. We get some of the most intense sunshine in the country, real winter nights, bone-dry air, and swings that can run from a hard freeze at sunrise to shirtsleeve weather by afternoon. So it''s a fair question: is a coated garage floor actually going to hold up here?</p>
<p>Short answer: yes — if it''s built for this climate. Here''s what our weather really does to a floor, and how the right system handles each season.</p>
<h2>What our sun does to the wrong floor</h2>
<p>Ultraviolet light is hard on plastics, and straight epoxy is no exception. Leave an unprotected epoxy floor in direct sunlight and it will slowly yellow and chalk, especially in that strip by the garage door that catches sun every afternoon. That amber stripe creeping in from the door while the shaded back half stays clear is the single most visible way a bargain floor announces itself in Albuquerque.</p>
<h2>Why the topcoat is the answer</h2>
<p>This is exactly why we finish floors with polyaspartic topcoats. Polyaspartic chemistry is UV stable — it holds its color in sunlight instead of yellowing. The decorative layer and the epoxy body sit protected underneath, and the surface that actually faces the sun is the one engineered for it. With sunshine like ours, I consider a UV-stable topcoat non-negotiable, not an upgrade.</p>
<h2>What winter throws at a garage floor</h2>
<p>Albuquerque winters are short but real. Cold nights pull a slab down hard, a sunny afternoon warms it right back up, and that cycle repeats all season. Cars drag in snowmelt and the de-icing brine that comes with it, and it all sits on the floor while the car drips dry. Bare concrete suffers here — water works into its pores, freezes, expands, and pops the surface apart, and de-icers speed the damage along. A properly bonded coating changes the game: it seals those pores so there''s nothing for water to soak into, and the mess wipes up instead of soaking in.</p>
<h2>Don''t forget summer</h2>
<p>The other seasonal test is hot-tire pickup. Park a car that''s been rolling on summer asphalt and the tires pour heat into the floor as they cool. Cheap coatings soften and let go, and the tell-tale is coating peeling up in tire-shaped patches. Surviving that comes down to product quality and, above all, prep — a coating ground into the slab holds on. A coating painted over a smooth, sealed surface lets go.</p>
<h2>The honest fine print</h2>
<p>The floors I''ve been describing are indoor floors — garages, basements, workshops, commercial spaces. That''s where our lifetime warranty applies: indoor concrete we prepare and install. Outdoor concrete like a patio lives in a different environment with its own UV-stable systems, and I''m glad to talk through that too, but I won''t pretend one promise covers both. When a company''s warranty has no fine print at all, read it again.</p>
<h2>Built here, for here</h2>
<p>Everything above is baked into how we build floors, because Albuquerque, Santa Fe, and Rio Rancho are the only places we build them. More than 560 floors in, the combination that survives our sun and our winters is no secret: honest prep, a properly bonded body coat, and a UV-stable polyaspartic topcoat over it all. Most residential installs still take just one day.</p>
<p>Want to know how your own garage would hold up? Call or text me at <a href="tel:5053524674">505-352-4674</a> or send the free <a href="/#contact">quote form</a> and I''ll come look at your slab myself — the quote is free and the advice is honest either way.</p>',
  'local',
  'published',
  '2026-07-27 11:00:00'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'will-an-epoxy-garage-floor-survive-albuquerque-sun-and-winter');

-- The three seeds cover three backlog topics — mark them consumed so the
-- weekly generator never writes a near-duplicate. No-op on re-run.
UPDATE post_topics SET used_at = NOW()
WHERE used_at IS NULL AND topic IN (
  'How much epoxy flooring costs in Albuquerque',
  'The best garage floor coating for the Albuquerque sun',
  'Epoxy vs. polyaspartic floor coatings compared'
);
