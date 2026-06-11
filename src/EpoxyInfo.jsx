import React, { useMemo } from 'react';
import styled from 'styled-components';
import useScrollReveal from './useScrollReveal';
import { mulberry32, FLAKE_PALETTES } from './accents';

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--section-pad) 24px;
  background: var(--bg0);
  overflow: hidden;

  @media (max-width: 900px) {
    min-height: auto;
    padding: 72px 24px 56px;
  }
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const SectionLabel = styled.p`
  font-size: var(--fs-eyebrow);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--resin);
  margin-bottom: 10px;
`;

const SectionTitle = styled.h2`
  font-size: var(--fs-h2);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-hi);
  line-height: 1.15;
  margin-bottom: 12px;

  span {
    background: var(--resin-grad);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: var(--resin);
  }
`;

const SectionSubtitle = styled.p`
  font-size: 0.95rem;
  color: var(--text-body);
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.7;
`;

/* ── Two-column layout ────────────────────────────────────────────── */
const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: stretch;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

/* ── Self-building cross-section diagram ──────────────────────────── */
const DiagramSide = styled.div`
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-dk-md);
  display: flex;
  align-items: center;
  padding: 24px 16px;

  svg {
    width: 100%;
    height: auto;
  }

  /* Layer build-up: transform/opacity only, fires once via .visible */
  .layer {
    opacity: 0;
    transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out);
    will-change: transform, opacity;
  }

  .concrete   { transform: translateY(28px);  transition-delay: 0.05s; }
  .grind      { transform: translateY(6px);   transition-delay: 0.4s; }
  .epoxy      { transform: translateY(-34px); transition-delay: 0.65s; }
  .flake-band { transform: translateY(-26px); transition-delay: 0.95s; }
  .topcoat    { transform: translateY(-24px); transition-delay: 1.55s; }

  .flakes polygon {
    opacity: 0;
    transform: translateY(-36px);
    transition: opacity 0.55s var(--ease-out), transform 0.55s var(--ease-out);
  }

  .gloss {
    transform: translateX(-140px);
  }

  &.visible {
    .layer { opacity: 1; transform: translateY(0); }
    .flakes polygon { opacity: 1; transform: translateY(0); }
    .gloss {
      transform: translateX(640px);
      transition: transform 1.2s var(--ease-smooth) 2s;
    }
  }

  @media (max-width: 900px) {
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
  }
`;

const StepsSide = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 14px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
`;

const StepCard = styled.div`
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 18px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-dk-sm);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              border-color var(--transition),
              box-shadow var(--transition);
  transition-delay: ${({ $delay }) => $delay || '0s'};

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateY(0);
  `}

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(240, 165, 0, 0.35);
    box-shadow: var(--shadow-dk-md);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--resin-grad);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover::before {
    transform: scaleX(1);
  }
`;

const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  background: rgba(240, 165, 0, 0.12);
  border: 1px solid rgba(240, 165, 0, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--resin-hot);
  margin-bottom: 10px;
  transition: background var(--transition), color var(--transition), transform var(--transition);

  ${StepCard}:hover & {
    background: var(--resin);
    border-color: var(--resin);
    color: #14110a;
    transform: scale(1.05);
  }
`;

const StepTitle = styled.h3`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-hi);
  margin-bottom: 6px;
  line-height: 1.2;
`;

const StepText = styled.p`
  font-size: 0.78rem;
  color: var(--text-body);
  line-height: 1.6;
`;

/* ── Data ─────────────────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    title: 'Diamond Grinding',
    text: 'We use 20-grit diamond bits on industrial grinders with built-in dust extractors — no dust, no mess. This opens the concrete pores and creates a rough profile so the epoxy mechanically locks in, not just sits on top.',
  },
  {
    num: '02',
    title: '100% Solids Epoxy',
    text: 'We apply 100% solids cycloaliphatic epoxy — zero solvents, zero fillers, maximum mil thickness. It chemically bonds to concrete and cures slower on purpose, giving it time to penetrate and anchor. Fast-cure "one day" resins skip this step entirely.',
  },
  {
    num: '03',
    title: 'Full Flake Broadcast',
    text: 'While the epoxy is still wet, we broadcast decorative vinyl flakes wall-to-wall until the surface is fully covered. This adds color, hides imperfections, and creates a natural decorative texture.',
  },
  {
    num: '04',
    title: 'Polyaspartic Topcoat',
    text: 'A commercial-grade polyaspartic clear coat is applied to seal and protect. It\'s UV-stable so it won\'t yellow in sunlight, resists hot tire pickup, and gives the floor a high-gloss showroom finish that lasts decades.',
  },
];

/* Mixed warm/grey flake colors for the broadcast band */
const DIAGRAM_FLAKE_COLORS = [...FLAKE_PALETTES.coyote, ...FLAKE_PALETTES.gravel];

const CrossSection = () => {
  const flakes = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: 64 }, (_, i) => {
      const cx = 48 + rand() * 462;
      const cy = 196 + rand() * 16;
      const r = 2 + rand() * 3.2;
      const rot = rand() * Math.PI * 2;
      const pts = [];
      for (let p = 0; p < 5; p++) {
        const a = rot + (p / 5) * Math.PI * 2;
        const j = 0.65 + rand() * 0.5;
        pts.push(`${(cx + Math.cos(a) * r * j).toFixed(1)},${(cy + Math.sin(a) * r * j).toFixed(1)}`);
      }
      return {
        points: pts.join(' '),
        color: DIAGRAM_FLAKE_COLORS[i % DIAGRAM_FLAKE_COLORS.length],
        delay: 0.95 + (i % 22) * 0.022,
      };
    });
  }, []);

  const aggregate = useMemo(() => {
    const rand = mulberry32(99);
    return Array.from({ length: 26 }, () => ({
      cx: (52 + rand() * 452).toFixed(1),
      cy: (262 + rand() * 110).toFixed(1),
      r: (3 + rand() * 7).toFixed(1),
      o: 0.25 + rand() * 0.3,
    }));
  }, []);

  return (
    <svg
      viewBox="0 96 560 304"
      role="img"
      aria-label="Epoxy flooring system layers — concrete, 100% solids cycloaliphatic epoxy base, flake broadcast, and polyaspartic topcoat"
    >
      <defs>
        <linearGradient id="xs-epoxy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc940" />
          <stop offset="100%" stopColor="#c98a00" />
        </linearGradient>
        <linearGradient id="xs-topcoat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
        </linearGradient>
        <clipPath id="xs-topclip">
          <rect x="40" y="170" width="480" height="22" rx="4" />
        </clipPath>
      </defs>

      {/* 01 — concrete slab with aggregate */}
      <g className="layer concrete">
        <rect x="40" y="240" width="480" height="140" rx="4" fill="#262b33" />
        {aggregate.map((a, i) => (
          <circle key={i} cx={a.cx} cy={a.cy} r={a.r} fill="#1b1f25" opacity={a.o} />
        ))}
        <rect x="40" y="240" width="480" height="140" rx="4" fill="none" stroke="rgba(255,255,255,0.06)" />
        <g fontFamily="inherit" fontSize="11" fontWeight="700">
          <rect x="4" y="296" width="30" height="20" rx="6" fill="#1f242c" stroke="rgba(240,165,0,0.4)" />
          <text x="19" y="310" textAnchor="middle" fill="#ffc940">01</text>
          <line x1="34" y1="306" x2="40" y2="306" stroke="rgba(240,165,0,0.4)" />
        </g>
      </g>

      {/* grind profile marks on the slab surface */}
      <g className="layer grind" stroke="#8a939e" strokeWidth="1.4" strokeLinecap="round" opacity="0.85">
        <path d="M56 240 l10 -5 M86 240 l9 -6 M118 240 l10 -5 M152 240 l8 -6 M186 240 l10 -5 M222 240 l9 -6 M258 240 l10 -5 M294 240 l8 -6 M330 240 l10 -5 M366 240 l9 -6 M402 240 l10 -5 M438 240 l8 -6 M474 240 l10 -5 M504 240 l8 -6" />
      </g>

      {/* 02 — 100% solids epoxy, poured down into place */}
      <g className="layer epoxy">
        <rect x="40" y="212" width="480" height="28" fill="url(#xs-epoxy)" />
        {/* drip running down the cut edge */}
        <path d="M520 226 c6 4 7 22 5 38 c-2 14 -6 22 -9 26 c-2 -10 -1 -44 4 -64 Z" fill="url(#xs-epoxy)" opacity="0.85" />
        <g fontFamily="inherit" fontSize="11" fontWeight="700">
          <rect x="4" y="216" width="30" height="20" rx="6" fill="#1f242c" stroke="rgba(240,165,0,0.4)" />
          <text x="19" y="230" textAnchor="middle" fill="#ffc940">02</text>
          <line x1="34" y1="226" x2="40" y2="226" stroke="rgba(240,165,0,0.4)" />
        </g>
      </g>

      {/* 03 — flake broadcast settling into the wet epoxy */}
      <g className="layer flake-band">
        <rect x="40" y="192" width="480" height="20" fill="#3a3325" />
        <g fontFamily="inherit" fontSize="11" fontWeight="700">
          <rect x="4" y="192" width="30" height="20" rx="6" fill="#1f242c" stroke="rgba(240,165,0,0.4)" />
          <text x="19" y="206" textAnchor="middle" fill="#ffc940">03</text>
          <line x1="34" y1="202" x2="40" y2="202" stroke="rgba(240,165,0,0.4)" />
        </g>
      </g>
      <g className="flakes">
        {flakes.map((f, i) => (
          <polygon
            key={i}
            points={f.points}
            fill={f.color}
            style={{ transitionDelay: `${f.delay}s` }}
          />
        ))}
      </g>

      {/* 04 — polyaspartic clear coat with gloss sweep */}
      <g className="layer topcoat">
        <rect x="40" y="170" width="480" height="22" rx="4" fill="url(#xs-topcoat)" />
        <line x1="46" y1="174" x2="514" y2="174" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" strokeLinecap="round" />
        <g clipPath="url(#xs-topclip)">
          <g transform="skewX(-18)">
            <rect className="gloss" x="0" y="160" width="90" height="42" fill="rgba(255,255,255,0.28)" />
          </g>
        </g>
        <g fontFamily="inherit" fontSize="11" fontWeight="700">
          <rect x="4" y="168" width="30" height="20" rx="6" fill="#1f242c" stroke="rgba(240,165,0,0.4)" />
          <text x="19" y="182" textAnchor="middle" fill="#ffc940">04</text>
          <line x1="34" y1="178" x2="40" y2="178" stroke="rgba(240,165,0,0.4)" />
        </g>
      </g>
    </svg>
  );
};

/* ── Component ────────────────────────────────────────────────────── */
const EpoxyInfo = () => {
  const [headerRef, headerVisible] = useScrollReveal();
  const [contentRef, contentVisible] = useScrollReveal({ threshold: 0.1 });
  const [diagramRef, diagramVisible] = useScrollReveal({ threshold: 0.35 });

  return (
    <Section>
      <Inner>
        <Header ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>Our Process</SectionLabel>
          <SectionTitle>
            Good Floors Take Two Days. <span>Great Ones Are Worth It.</span>
          </SectionTitle>
          <SectionSubtitle>
            "One day" coatings use fast-cure resins that look good on day one and fail on year one.
            We take the extra day because quality epoxy needs time to chemically
            bond to your concrete — and that bond is what makes a floor last forever.
          </SectionSubtitle>
        </Header>

        <ContentLayout ref={contentRef}>
          <DiagramSide ref={diagramRef} className={diagramVisible ? 'visible' : ''}>
            <CrossSection />
          </DiagramSide>

          <StepsSide>
            {steps.map((s, i) => (
              <StepCard key={s.num} $visible={contentVisible} $delay={`${i * 0.1}s`}>
                <StepNumber>{s.num}</StepNumber>
                <StepTitle>{s.title}</StepTitle>
                <StepText>{s.text}</StepText>
              </StepCard>
            ))}
          </StepsSide>
        </ContentLayout>

      </Inner>
    </Section>
  );
};

export default EpoxyInfo;
