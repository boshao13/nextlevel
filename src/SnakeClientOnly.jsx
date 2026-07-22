'use client';

import dynamic from 'next/dynamic';

// Snake is a browser-only easter egg (window sizing, keydown/resize
// listeners, Math.random food placement, react-confetti). No SEO value —
// render client-side only.
const Snake = dynamic(() => import('./Snake'), { ssr: false });

export default function SnakeClientOnly() {
  return <Snake />;
}
