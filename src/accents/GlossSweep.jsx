'use client';

import React from 'react';
import styled from 'styled-components';
import useScrollReveal from '../useScrollReveal';

const Wrap = styled.span`
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: -40%;
    bottom: -40%;
    left: 0;
    width: 38%;
    background: linear-gradient(
      100deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.22) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-160%) rotate(14deg);
    will-change: transform;
  }

  &.visible::before {
    transition: transform 1.25s var(--ease-smooth) 0.25s;
    transform: translateX(420%) rotate(14deg);
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

/**
 * One-shot gloss/sheen sweep across the parent (parent needs
 * position:relative; border-radius is inherited). Self-observes by default,
 * or pass `active` to drive it from the parent's reveal state.
 */
const GlossSweep = ({ active, ...rest }) => {
  const [ref, seen] = useScrollReveal({ threshold: 0.6, rootMargin: '0px' });
  const on = typeof active === 'boolean' ? active : seen;

  return <Wrap ref={ref} className={on ? 'visible' : ''} aria-hidden="true" {...rest} />;
};

export default GlossSweep;
