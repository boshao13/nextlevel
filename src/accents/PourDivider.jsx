import React from 'react';
import styled from 'styled-components';
import useScrollReveal from '../useScrollReveal';

const Band = styled.div`
  position: relative;
  height: ${({ $height }) => $height}px;
  overflow: hidden;
  line-height: 0;
  margin-top: -1px;
  margin-bottom: -1px;

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .liquid {
    transform: translateY(-103%);
    transition: transform 1.5s var(--ease-out);
    will-change: transform;
  }

  &.visible .liquid {
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .liquid {
      transform: translateY(0);
    }
  }
`;

/**
 * Section divider: a glossy epoxy pour that spills down out of the section
 * above as it enters the viewport (transform-only, fires once).
 * Props:
 *  - color: fill for the liquid ('resin' gradient | any CSS color)
 *  - height: band height in px (default 96)
 */
const PourDivider = ({ color = 'resin', height = 96, ...rest }) => {
  const [ref, visible] = useScrollReveal({ threshold: 0.4, rootMargin: '0px' });
  const useGrad = color === 'resin';
  const fill = useGrad ? 'url(#pour-resin)' : color;

  return (
    <Band ref={ref} $height={height} className={visible ? 'visible' : ''} aria-hidden="true" {...rest}>
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" focusable="false">
        {useGrad && (
          <defs>
            <linearGradient id="pour-resin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffc940" />
              <stop offset="55%" stopColor="#f0a500" />
              <stop offset="100%" stopColor="#c98a00" />
            </linearGradient>
          </defs>
        )}
        <g className="liquid">
          {/* Liquid body with a smooth, rounded leveling edge — no spikes */}
          <path
            fill={fill}
            d="M0,-8 H1440 V48
               C1392,60 1344,66 1296,61
               C1248,56 1224,44 1176,45
               C1128,46 1104,62 1056,66
               C1008,70 984,56 936,51
               C888,46 864,52 816,58
               C768,64 744,68 696,63
               C648,58 624,46 576,47
               C528,48 504,62 456,66
               C408,70 384,60 336,54
               C288,48 264,46 216,50
               C168,54 144,64 96,62
               C48,60 24,52 0,49 Z"
          />
          {/* Gloss highlight along the surface */}
          <path
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            d="M28,16 C320,10 760,22 1180,14 C1270,12 1352,16 1414,14"
          />
        </g>
      </svg>
    </Band>
  );
};

export default PourDivider;
