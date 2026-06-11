import React, { useMemo } from 'react';
import { mulberry32 } from './flakePalettes';

/**
 * Diamond-grind circular pattern — concentric dashed rings + radial scratch
 * ticks, like a grinder pass on concrete. Background accent; stroke follows
 * currentColor so the consumer sets tone via `color` CSS.
 */
const GrindRing = ({ size = 480, seed = 11, ...rest }) => {
  const ticks = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: 26 }, () => {
      const a = rand() * Math.PI * 2;
      const r1 = 60 + rand() * 160;
      const r2 = r1 + 10 + rand() * 26;
      return {
        x1: (240 + Math.cos(a) * r1).toFixed(1),
        y1: (240 + Math.sin(a) * r1).toFixed(1),
        x2: (240 + Math.cos(a) * r2).toFixed(1),
        y2: (240 + Math.sin(a) * r2).toFixed(1),
        o: 0.25 + rand() * 0.5,
      };
    });
  }, [seed]);

  return (
    <svg width={size} height={size} viewBox="0 0 480 480" aria-hidden="true" focusable="false" {...rest}>
      <g fill="none" stroke="currentColor">
        <circle cx="240" cy="240" r="72" strokeWidth="1" strokeDasharray="3 14" />
        <circle cx="240" cy="240" r="118" strokeWidth="1" strokeDasharray="2 9" opacity="0.8" />
        <circle cx="240" cy="240" r="164" strokeWidth="1" strokeDasharray="4 18" opacity="0.65" />
        <circle cx="240" cy="240" r="206" strokeWidth="1" strokeDasharray="2 12" opacity="0.5" />
        <circle cx="240" cy="240" r="236" strokeWidth="1" strokeDasharray="6 24" opacity="0.35" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth="0.8" opacity={t.o} />
        ))}
      </g>
    </svg>
  );
};

export default GrindRing;
