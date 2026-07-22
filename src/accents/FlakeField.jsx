'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FLAKE_PALETTES, DEFAULT_PALETTE, mulberry32 } from './flakePalettes';

const Svg = styled.svg`
  display: block;

  &.settle g.flake {
    opacity: 0;
    transform: translateY(var(--fall)) rotate(var(--spin));
    transition: transform var(--dur-slow) var(--ease-out),
                opacity var(--dur-slow) var(--ease-out);
  }

  &.settle.visible g.flake {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
`;

const makeFlake = (rand, w, h) => {
  const cx = rand() * w;
  const cy = rand() * h;
  const r = 2.2 + rand() * 3.4;
  const sides = 5;
  const rot = rand() * Math.PI * 2;
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    const jitter = 0.65 + rand() * 0.55;
    pts.push(`${(cx + Math.cos(a) * r * jitter).toFixed(1)},${(cy + Math.sin(a) * r * jitter).toFixed(1)}`);
  }
  return { points: pts.join(' '), opacity: 0.7 + rand() * 0.3, fall: 24 + rand() * 56, spin: -14 + rand() * 28 };
};

/**
 * Decorative flake-speckle field, colors sampled from real flake blends.
 * Props:
 *  - palette: key of FLAKE_PALETTES or an array of colors (default nightfall)
 *  - count / seed: density + deterministic layout
 *  - area: [w, h] viewBox (default [600, 200])
 *  - settle: animate flakes scattering down into place
 *  - visible: drives the settle animation (pair with useScrollReveal)
 */
const FlakeField = ({
  palette = DEFAULT_PALETTE,
  count = 64,
  seed = 7,
  area = [600, 200],
  settle = false,
  visible = false,
  className = '',
  ...rest
}) => {
  const colors = Array.isArray(palette) ? palette : (FLAKE_PALETTES[palette] || DEFAULT_PALETTE);
  const [w, h] = area;

  const flakes = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => makeFlake(rand, w, h));
  }, [count, seed, w, h]);

  const cls = [className, settle ? 'settle' : '', settle && visible ? 'visible' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <Svg viewBox={`0 0 ${w} ${h}`} className={cls} aria-hidden="true" focusable="false" {...rest}>
      {flakes.map((f, i) => (
        <g
          key={i}
          className="flake"
          style={settle ? { '--fall': `${-f.fall}px`, '--spin': `${f.spin}deg`, transitionDelay: `${(i % 28) * 38}ms` } : undefined}
        >
          <polygon points={f.points} fill={colors[i % colors.length]} opacity={f.opacity} />
        </g>
      ))}
    </Svg>
  );
};

export default FlakeField;
