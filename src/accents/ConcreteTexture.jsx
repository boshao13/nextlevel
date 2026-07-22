'use client';

import React, { useId } from 'react';
import styled from 'styled-components';

const Svg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

/**
 * Subtle concrete-grain overlay (SVG fractal noise). Drop inside any
 * position:relative section; sits under content visually via low opacity.
 */
const ConcreteTexture = ({ opacity = 0.05, ...rest }) => {
  const id = useId().replace(/[:]/g, '');
  return (
    <Svg aria-hidden="true" focusable="false" {...rest}>
      <filter id={`grain-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${id})`} opacity={opacity} />
    </Svg>
  );
};

export default ConcreteTexture;
