import React from 'react';

/**
 * Hand-drawn epoxy-trade line-art icons. Stroke follows currentColor.
 * Decorative by default (aria-hidden) — pass aria-hidden={false} + aria-label
 * when an icon is meaningful on its own.
 */
const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
});

export const TrowelIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 10.5 9.5 4l6 6-6.5 6.5a2.2 2.2 0 0 1-3.1 0L3 13.6a2.2 2.2 0 0 1 0-3.1Z" />
    <path d="m13.5 8.5 3-3" />
    <path d="M16 5.9c.9-.9 2.4-.9 3.2 0 .9.9.9 2.3 0 3.2l-1.1 1" />
  </svg>
);

export const SqueegeeIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3v8" />
    <path d="M9 3h6" />
    <rect x="4" y="11" width="16" height="4" rx="1.4" />
    <path d="M6 15v2.5M12 15v3.5M18 15v2.5" />
  </svg>
);

export const FlakeChipIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="m7.5 4 3 1.5L10 9l-3.5 1L5 6.5 7.5 4Z" />
    <path d="m15 7 3.5.5 1 3.5-2.5 2-3-2 1-4Z" />
    <path d="m9 14.5 3.5 1 .5 3.5-3 1.5-2.5-2.5 1.5-3.5Z" />
  </svg>
);

export const GrindWheelIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 4v2.4M20 12h-2.4M12 20v-2.4M4 12h2.4M17.6 6.4l-1.7 1.7M17.6 17.6l-1.7-1.7M6.4 17.6l1.7-1.7M6.4 6.4l1.7 1.7" />
  </svg>
);

export const LayersIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="m12 3 9 4.5L12 12 3 7.5 12 3Z" />
    <path d="m4.8 11.4 7.2 3.6 7.2-3.6" />
    <path d="m4.8 15.9 7.2 3.6 7.2-3.6" />
  </svg>
);

export const ShieldGlossIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m8.7 11.6 2.3 2.3 4.3-4.6" />
  </svg>
);

export const SparkleIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 4c.7 3.6 2.2 5.4 6 6-3.8.6-5.3 2.4-6 6-.7-3.6-2.2-5.4-6-6 3.8-.6 5.3-2.4 6-6Z" />
    <path d="M18.5 15.5c.3 1.5 1 2.3 2.5 2.5-1.5.2-2.2 1-2.5 2.5-.3-1.5-1-2.3-2.5-2.5 1.5-.2 2.2-1 2.5-2.5Z" />
  </svg>
);

export const DropIcon = ({ size = 24, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3.5s6 6.2 6 10.5a6 6 0 1 1-12 0C6 9.7 12 3.5 12 3.5Z" />
    <path d="M9.5 14.5a2.6 2.6 0 0 0 2 2.4" />
  </svg>
);
