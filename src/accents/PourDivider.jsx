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
    transform: translateX(-104%);
    transition: transform 1.7s var(--ease-out);
    will-change: transform;
  }

  &.visible .liquid {
    transform: translateX(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .liquid {
      transform: translateX(0);
    }
  }
`;

/**
 * Section divider: a glossy epoxy pour that flows across the band as it
 * enters the viewport (transform-only, fires once).
 * Props:
 *  - color: fill for the liquid ('resin' gradient | any CSS color)
 *  - height: band height in px (default 96)
 */
const PourDivider = ({ color = 'resin', height = 96, ...rest }) => {
  const [ref, visible] = useScrollReveal({ threshold: 0.4, rootMargin: '0px' });
  const useGrad = color === 'resin';

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
          {/* Liquid body with a wavy, drippy bottom edge */}
          <path
            fill={useGrad ? 'url(#pour-resin)' : color}
            d="M0,0 H1448 V46
               C1396,62 1372,40 1318,52
               C1290,58 1278,76 1252,70
               C1226,64 1222,44 1186,48
               C1138,54 1124,72 1082,64
               C1040,56 1030,38 986,44
               C942,50 936,68 894,66
               C852,64 842,42 798,46
               C754,50 748,70 706,68
               C664,66 656,44 612,46
               C568,48 562,66 520,64
               C478,62 470,40 426,44
               C382,48 376,64 334,62
               C292,60 284,42 240,46
               C196,50 190,66 148,62
               C106,58 98,44 54,48
               C28,50 14,58 0,54 Z"
          />
          {/* Hanging drips */}
          <path fill={useGrad ? 'url(#pour-resin)' : color} d="M312,58 c0,14 -4,24 -9,30 c-5,-6 -9,-16 -9,-30 c6,3 12,3 18,0 Z" />
          <path fill={useGrad ? 'url(#pour-resin)' : color} d="M737,64 c0,11 -3,19 -7,24 c-4,-5 -7,-13 -7,-24 c5,2 9,2 14,0 Z" />
          <path fill={useGrad ? 'url(#pour-resin)' : color} d="M1102,60 c0,16 -5,26 -10,33 c-5,-7 -10,-17 -10,-33 c7,3 13,3 20,0 Z" />
          {/* Gloss highlight along the surface */}
          <path
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            d="M28,18 C320,12 760,24 1180,16 C1270,14 1352,18 1414,16"
          />
        </g>
      </svg>
    </Band>
  );
};

export default PourDivider;
