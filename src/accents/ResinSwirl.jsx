'use client';

import React from 'react';
import styled from 'styled-components';

const Svg = styled.svg`
  display: block;
  width: 100%;
  height: ${({ $height }) => $height}px;
`;

/**
 * Quiet marbled-resin section divider — layered ribbon curves in steel/amber,
 * static (no loop), very low opacity. Use where the pour divider is too loud.
 */
const ResinSwirl = ({ height = 72, ...rest }) => (
  <Svg viewBox="0 0 1440 72" preserveAspectRatio="none" $height={height} aria-hidden="true" focusable="false" {...rest}>
    <path
      d="M0,42 C220,12 420,66 720,40 C1020,14 1220,58 1440,30"
      fill="none" stroke="var(--steel)" strokeOpacity="0.22" strokeWidth="1.6"
    />
    <path
      d="M0,52 C260,28 460,70 760,48 C1060,26 1240,64 1440,42"
      fill="none" stroke="var(--resin)" strokeOpacity="0.18" strokeWidth="1.2"
    />
    <path
      d="M0,30 C240,52 480,8 780,30 C1080,52 1260,16 1440,52"
      fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1"
    />
  </Svg>
);

export default ResinSwirl;
