import React, { useEffect, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiPhone, FiHome, FiBriefcase, FiTool, FiMail, FiDroplet } from 'react-icons/fi';

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
    $subpage
      ? css`
          background: var(--primary);
          backdrop-filter: none;
          box-shadow: 0 2px 12px rgba(15, 76, 129, 0.3);
        `
      : $scrolled
        ? css`
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 1px 0 rgba(15, 76, 129, 0.08), var(--shadow-sm);
          `
        : css`
            background: transparent;
            backdrop-filter: none;
            box-shadow: none;
          `}

  @media (max-width: 768px) {
    padding: 0 20px;
    height: 64px;
    ${({ $subpage }) =>
      $subpage
        ? css`
            background: var(--primary);
            box-shadow: 0 2px 12px rgba(15, 76, 129, 0.3);
          `
        : css`
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: var(--shadow-sm);
          `}
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
  transition: opacity var(--transition), filter var(--transition);
  filter: ${({ $scrolled, $subpage }) =>
    $subpage ? 'brightness(0) invert(1)' : $scrolled ? 'none' : 'brightness(0) invert(1)'};

  &:hover {
    opacity: 0.85;
  }

  @media (max-width: 768px) {
    filter: ${({ $subpage }) => ($subpage ? 'brightness(0) invert(1)' : 'none')};
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

const NavLink = styled(Link)`
  position: relative;
  padding: 8px 14px;
  font-size: 0.92rem;
  font-weight: 500;
  color: ${({ $scrolled, $subpage }) =>
    $subpage ? 'rgba(255,255,255,0.92)' : $scrolled ? 'var(--text)' : 'rgba(255,255,255,0.92)'};
  border-radius: var(--radius-sm);
  transition: color var(--transition), background var(--transition);

  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 14px;
    right: 14px;
    height: 2px;
    background: ${({ $subpage }) => ($subpage ? 'white' : 'var(--primary)')};
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.25s var(--ease);
  }

  &:hover {
    color: ${({ $subpage }) => ($subpage ? 'white' : 'var(--primary)')};
    &::after { transform: scaleX(1); }
  }
`;

const NavAnchor = styled.a`
  position: relative;
  padding: 8px 14px;
  font-size: 0.92rem;
  font-weight: 500;
  color: ${({ $scrolled, $subpage }) =>
    $subpage ? 'rgba(255,255,255,0.92)' : $scrolled ? 'var(--text)' : 'rgba(255,255,255,0.92)'};
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition);

  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 14px;
    right: 14px;
    height: 2px;
    background: ${({ $subpage }) => ($subpage ? 'white' : 'var(--primary)')};
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.25s var(--ease);
  }

  &:hover {
    color: ${({ $subpage }) => ($subpage ? 'white' : 'var(--primary)')};
    &::after { transform: scaleX(1); }
  }
`;

const PhoneButton = styled.a`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: ${({ $subpage }) => ($subpage ? 'white' : 'var(--primary)')};
  color: ${({ $subpage }) => ($subpage ? 'var(--primary)' : 'white')};
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  margin-left: 8px;
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
  box-shadow: ${({ $subpage }) =>
    $subpage ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(15, 76, 129, 0.25)'};

  &:hover {
    background: ${({ $subpage }) => ($subpage ? 'rgba(255,255,255,0.85)' : 'var(--primary-dark)')};
    transform: translateY(-2px);
    box-shadow: ${({ $subpage }) =>
      $subpage ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(15, 76, 129, 0.4)'};
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
    background: ${({ $subpage }) => ($subpage ? 'white' : 'var(--primary)')};
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
  background: rgba(10, 18, 35, 0.55);
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
  background: white;
  z-index: 999;
  display: flex;
  flex-direction: column;
  padding: 80px 32px 40px;
  gap: 4px;
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.15);
`;

const MobileNavLink = styled(Link)`
  display: block;
  padding: 14px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: var(--primary);
    padding-left: 6px;
  }
`;

const MobileNavAnchor = styled.a`
  display: block;
  padding: 14px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: var(--primary);
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
  background: var(--primary);
  color: white;
  font-weight: 700;
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: background var(--transition);

  &:hover {
    background: var(--primary-dark);
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
    background: white;
    border-top: 1px solid rgba(15, 76, 129, 0.1);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
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
  color: ${({ $active }) => ($active ? 'var(--primary)' : 'rgba(15, 76, 129, 0.5)')};
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
  color: rgba(15, 76, 129, 0.5);
  cursor: pointer;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
`;

const SUBPAGES = ['/commercial', '/careers', '/garagemakeover', '/radon', '/colors'];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isSubpage = SUBPAGES.includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Close menu on route change
    setIsOpen(false);
  }, [location.pathname]);

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
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollToContact: true } });
    } else {
      scrollToContact();
    }
  };

  useEffect(() => {
    if (location.state?.scrollToContact) scrollToContact();
  }, [location, scrollToContact]);

  return (
    <>
      <HeaderContainer $scrolled={scrolled} $subpage={isSubpage}>
        <LogoLink to="/">
          <LogoImg
            $scrolled={scrolled}
            $subpage={isSubpage}
            src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}
            alt="Next Level Epoxy Flooring"
          />
        </LogoLink>

        <Nav>
          <NavLink to="/" $scrolled={scrolled} $subpage={isSubpage} onClick={handleNavClick}>Home</NavLink>
          <NavLink to="/commercial" $scrolled={scrolled} $subpage={isSubpage} onClick={handleNavClick}>Commercial</NavLink>
          <NavLink to="/garagemakeover" $scrolled={scrolled} $subpage={isSubpage} onClick={handleNavClick}>Garage Makeover</NavLink>
          <NavLink to="/colors" $scrolled={scrolled} $subpage={isSubpage} onClick={handleNavClick}>Colors</NavLink>
          <NavLink to="/careers" $scrolled={scrolled} $subpage={isSubpage} onClick={handleNavClick}>Careers</NavLink>
          <NavAnchor href="#contact" onClick={handleContactClick} $scrolled={scrolled} $subpage={isSubpage}>Contact</NavAnchor>
          <PhoneButton href="tel:5053524674" $subpage={isSubpage}>
            <FiPhone size={14} />
            505-352-4674
          </PhoneButton>
        </Nav>

        <HamburgerBtn onClick={() => setIsOpen(!isOpen)} $open={isOpen} $subpage={isSubpage} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
          <span />
          <span />
          <span />
        </HamburgerBtn>
      </HeaderContainer>

      <MobileOverlay $open={isOpen} onClick={() => setIsOpen(false)} />

      <MobileMenu $open={isOpen}>
        <MobileNavLink to="/" onClick={handleNavClick}>Home</MobileNavLink>
        <MobileNavLink to="/commercial" onClick={handleNavClick}>Commercial</MobileNavLink>
        <MobileNavLink to="/garagemakeover" onClick={handleNavClick}>Garage Makeover</MobileNavLink>
        <MobileNavLink to="/colors" onClick={handleNavClick}>Colors</MobileNavLink>
        <MobileNavLink to="/careers" onClick={handleNavClick}>Careers</MobileNavLink>
        <MobileNavAnchor href="#contact" onClick={handleContactClick}>Contact Us</MobileNavAnchor>
        <MobilePhoneBtn href="tel:5053524674">
          <FiPhone size={16} />
          505-352-4674
        </MobilePhoneBtn>
      </MobileMenu>

      <BottomTabBar>
        <TabItem to="/" onClick={handleNavClick} $active={location.pathname === '/'}>
          <FiHome size={20} />
          Home
        </TabItem>
        <TabItem to="/commercial" onClick={handleNavClick} $active={location.pathname === '/commercial'}>
          <FiBriefcase size={20} />
          Commercial
        </TabItem>
        <TabItem to="/garagemakeover" onClick={handleNavClick} $active={location.pathname === '/garagemakeover'}>
          <FiTool size={20} />
          Makeover
        </TabItem>
        <TabItem to="/colors" onClick={handleNavClick} $active={location.pathname === '/colors'}>
          <FiDroplet size={20} />
          Colors
        </TabItem>
        <TabAnchor href="#contact" onClick={handleContactClick}>
          <FiMail size={20} />
          Contact
        </TabAnchor>
      </BottomTabBar>
    </>
  );
};

export default Header;
