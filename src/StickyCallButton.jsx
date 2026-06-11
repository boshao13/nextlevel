import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FiPhone } from 'react-icons/fi';
import { trackPhoneClick } from './lib/analytics';

const pulse = keyframes`
  0%   { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), 0 0 0 0 rgba(240, 165, 0, 0.55); }
  70%  { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), 0 0 0 14px rgba(240, 165, 0, 0); }
  100% { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), 0 0 0 0 rgba(240, 165, 0, 0); }
`;

// Mobile-only floating call button that stays visible during scroll.
const FloatingBtn = styled.a`
  display: none;

  @media (max-width: 900px) {
    display: flex;
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 950;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    border-radius: 9999px;
    background: var(--resin-grad);
    color: #14110a;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    -webkit-tap-highlight-color: transparent;
    animation: ${pulse} 2.4s ease-out infinite;
    transition: transform 0.15s;
  }

  &:active {
    transform: scale(0.97);
  }

  /* Hide while admin pages are open (they have their own UI) */
  body[data-route^="/admin"] & {
    display: none;
  }
`;

// Hide on admin routes by setting body data attribute from the layout. Until
// then we just check window.location at render time. Re-renders on each route
// change because parent re-renders.
function isAdminRoute() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
}

const StickyCallButton = () => {
  if (isAdminRoute()) return null;
  return (
    <FloatingBtn
      href="tel:5053524674"
      aria-label="Call Next Level Epoxy at 505-352-4674"
      onClick={() => trackPhoneClick('sticky_floating')}
    >
      <FiPhone size={18} />
      Call Now
    </FloatingBtn>
  );
};

export default StickyCallButton;
