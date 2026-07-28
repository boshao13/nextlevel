'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiPhone, FiHome, FiBriefcase, FiTool, FiMail, FiDroplet } from 'react-icons/fi';
import { trackPhoneClick } from './lib/analytics';

const glassDark = css`
  background: rgba(12, 14, 17, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 var(--line), var(--shadow-dk-sm);
`;

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 1000;
  transition: background var(--transition), box-shadow var(--transition);

  ${({ $scrolled, $subpage }) =>
    $subpage || $scrolled
      ? glassDark
      : css`
          background: transparent;
          backdrop-filter: none;
          box-shadow: none;
        `}

  @media (max-width: 768px) {
    padding: 0 20px;
    height: 64px;
    ${glassDark}
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;

const LogoImg = styled.img`
  height: 48px;
  width: auto;
  /* White wordmark on the dark theme, all states */
  filter: brightness(0) invert(1);
  transition: opacity var(--transition);

  &:hover {
    opacity: 0.85;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 900px) {
    display: none;
  }
`;

/* Desktop "Service Areas" hover dropdown — the three city pages were footer +
   mobile-only before, starving them of internal links from every page. */
const AreasItem = styled.div`
  position: relative;

  &:hover > div,
  &:focus-within > div {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`;

const AreasPanel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  min-width: 190px;
  padding: 8px;
  background: rgba(14, 17, 22, 0.97);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  translate: -50% 0;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
  z-index: 60;

  a {
    display: block;
    padding: 10px 14px;
    border-radius: 8px;
    color: var(--text-body);
    text-decoration: none;
    font-size: 0.92rem;
    font-weight: 600;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: rgba(240, 165, 0, 0.08);
      color: var(--resin-hot);
    }
  }
`;

const navItem = css`
  position: relative;
  padding: 8px 14px;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-body);
  border-radius: var(--radius-sm);
  transition: color var(--transition);

  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 14px;
    right: 14px;
    height: 2px;
    background: var(--resin);
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.25s var(--ease-out);
  }

  &:hover {
    color: var(--text-hi);
    &::after { transform: scaleX(1); }
  }
`;

const NavLink = styled(Link)`
  ${navItem}
`;

const NavAnchor = styled.a`
  ${navItem}
  cursor: pointer;
`;

const PhoneButton = styled.a`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: var(--resin-grad);
  color: #14110a;
  font-size: 0.88rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  margin-left: 8px;
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);
  box-shadow: 0 2px 14px rgba(240, 165, 0, 0.3);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 4px 22px rgba(240, 165, 0, 0.42);
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const HamburgerBtn = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 24px;
  position: relative;
  z-index: 1001;

  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  span {
    display: block;
    width: 24px;
    height: 2.5px;
    background: var(--text-hi);
    border-radius: 2px;
    position: absolute;
    left: 4px;
    transition: transform 0.3s ease, opacity 0.3s ease;

    &:nth-child(1) {
      top: 3px;
      ${({ $open }) => $open && css`
        transform: translateY(8.5px) rotate(45deg);
      `}
    }

    &:nth-child(2) {
      top: 11px;
      ${({ $open }) => $open && css`
        opacity: 0;
      `}
    }

    &:nth-child(3) {
      top: 19px;
      ${({ $open }) => $open && css`
        transform: translateY(-8.5px) rotate(-45deg);
      `}
    }
  }
`;

const MobileOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 8, 0.7);
  z-index: 998;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'all' : 'none')};
  transition: opacity var(--transition);
`;

const MobileMenu = styled.nav`
  position: fixed;
  top: 0;
  right: 0;
  width: min(320px, 88vw);
  height: 100%;
  background: var(--bg1);
  border-left: 1px solid var(--line);
  z-index: 999;
  display: flex;
  flex-direction: column;
  padding: 80px 32px 40px;
  gap: 4px;
  overflow-y: auto;
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
`;

const MobileNavLink = styled(Link)`
  display: block;
  padding: 14px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-hi);
  border-bottom: 1px solid var(--line);
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: var(--resin-hot);
    padding-left: 6px;
  }
`;

const MobileSectionLabel = styled.div`
  margin-top: 18px;
  padding-bottom: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
`;

const MobileSubLink = styled(Link)`
  display: block;
  padding: 12px 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-body);
  border-bottom: 1px solid var(--line);
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: var(--resin-hot);
    padding-left: 6px;
  }
`;

const MobileNavAnchor = styled.a`
  display: block;
  padding: 14px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-hi);
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: var(--resin-hot);
    padding-left: 6px;
  }
`;

const MobilePhoneBtn = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 14px 20px;
  background: var(--resin-grad);
  color: #14110a;
  font-weight: 700;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: filter var(--transition);

  &:hover {
    filter: brightness(1.07);
  }
`;

const BottomTabBar = styled.nav`
  display: none;

  @media (max-width: 900px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(12, 14, 17, 0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--line);
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.4);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom, 0px));
    justify-content: space-around;
    align-items: center;
  }
`;

const TabItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${({ $active }) => ($active ? 'var(--resin)' : 'var(--text-dim)')};
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  svg {
    transition: transform 0.2s ease;
  }

  ${({ $active }) => $active && css`
    svg { transform: scale(1.1); }
  `}
`;

const TabAnchor = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-dim);
  cursor: pointer;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
`;

const SUBPAGES = ['/commercial', '/careers', '/garagemakeover', '/patios', '/radon', '/colors', '/polished-concrete', '/thank-you', '/privacy', '/terms'];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isSubpage = SUBPAGES.includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Close menu on route change
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const scrollToContact = useCallback(() => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (pathname !== '/') {
      // Cross-page contact: hash navigation — Next scrolls to #contact on
      // arrival; html { scroll-behavior: smooth } animates it.
      router.push('/#contact');
    } else {
      scrollToContact();
    }
  };

  return (
    <>
      <HeaderContainer $scrolled={scrolled} $subpage={isSubpage}>
        <LogoLink href="/">
          <LogoImg
            src="/nextlevellogo.png"
            alt="Next Level Epoxy Flooring"
          />
        </LogoLink>

        <Nav>
          <NavLink href="/" onClick={handleNavClick}>Home</NavLink>
          <NavLink href="/commercial" onClick={handleNavClick}>Commercial</NavLink>
          <NavLink href="/garagemakeover" onClick={handleNavClick}>Garage Makeover</NavLink>
          <NavLink href="/patios" onClick={handleNavClick}>Patios</NavLink>
          <NavLink href="/colors" onClick={handleNavClick}>Colors</NavLink>
          <NavLink href="/polished-concrete" onClick={handleNavClick}>Polished Concrete</NavLink>
          <AreasItem>
            <NavLink href="/epoxy-flooring-albuquerque" onClick={handleNavClick} aria-haspopup="true">Service Areas</NavLink>
            <AreasPanel>
              <Link href="/epoxy-flooring-albuquerque" onClick={handleNavClick}>Epoxy Flooring Albuquerque</Link>
              <Link href="/epoxy-flooring-rio-rancho" onClick={handleNavClick}>Epoxy Flooring Rio Rancho</Link>
              <Link href="/epoxy-flooring-santa-fe" onClick={handleNavClick}>Epoxy Flooring Santa Fe</Link>
            </AreasPanel>
          </AreasItem>
          <NavLink href="/careers" onClick={handleNavClick}>Careers</NavLink>
          <NavAnchor href="/#contact" onClick={handleContactClick}>Contact</NavAnchor>
          <PhoneButton href="tel:5053524674" onClick={() => trackPhoneClick('header_desktop')}>
            <FiPhone size={14} />
            505-352-4674
          </PhoneButton>
        </Nav>

        <HamburgerBtn onClick={() => setIsOpen(!isOpen)} $open={isOpen} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
          <span />
          <span />
          <span />
        </HamburgerBtn>
      </HeaderContainer>

      <MobileOverlay $open={isOpen} onClick={() => setIsOpen(false)} />

      <MobileMenu $open={isOpen}>
        <MobileNavLink href="/" onClick={handleNavClick}>Home</MobileNavLink>
        <MobileNavLink href="/commercial" onClick={handleNavClick}>Commercial</MobileNavLink>
        <MobileNavLink href="/garagemakeover" onClick={handleNavClick}>Garage Makeover</MobileNavLink>
        <MobileNavLink href="/patios" onClick={handleNavClick}>Patios</MobileNavLink>
        <MobileNavLink href="/colors" onClick={handleNavClick}>Colors</MobileNavLink>
        <MobileNavLink href="/polished-concrete" onClick={handleNavClick}>Polished Concrete</MobileNavLink>
        <MobileNavLink href="/careers" onClick={handleNavClick}>Careers</MobileNavLink>
        <MobileNavAnchor href="/#contact" onClick={handleContactClick}>Contact Us</MobileNavAnchor>
        <MobileSectionLabel>Service Areas</MobileSectionLabel>
        <MobileSubLink href="/epoxy-flooring-albuquerque" onClick={handleNavClick}>Albuquerque</MobileSubLink>
        <MobileSubLink href="/epoxy-flooring-santa-fe" onClick={handleNavClick}>Santa Fe</MobileSubLink>
        <MobileSubLink href="/epoxy-flooring-rio-rancho" onClick={handleNavClick}>Rio Rancho</MobileSubLink>
        <MobilePhoneBtn href="tel:5053524674" onClick={() => trackPhoneClick('header_mobile')}>
          <FiPhone size={16} />
          505-352-4674
        </MobilePhoneBtn>
      </MobileMenu>

      <BottomTabBar>
        <TabItem href="/" onClick={handleNavClick} $active={pathname === '/'}>
          <FiHome size={20} />
          Home
        </TabItem>
        <TabItem href="/commercial" onClick={handleNavClick} $active={pathname === '/commercial'}>
          <FiBriefcase size={20} />
          Commercial
        </TabItem>
        <TabItem href="/garagemakeover" onClick={handleNavClick} $active={pathname === '/garagemakeover'}>
          <FiTool size={20} />
          Makeover
        </TabItem>
        <TabItem href="/colors" onClick={handleNavClick} $active={pathname === '/colors'}>
          <FiDroplet size={20} />
          Colors
        </TabItem>
        <TabAnchor href="/#contact" onClick={handleContactClick}>
          <FiMail size={20} />
          Contact
        </TabAnchor>
      </BottomTabBar>
    </>
  );
};

export default Header;
