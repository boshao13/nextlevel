import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaInstagram } from 'react-icons/fa';
import codelabsLogo from './images/codelabslogo.png';
import { FiPhone, FiMapPin } from 'react-icons/fi';
import { trackPhoneClick } from './lib/analytics';

const FooterEl = styled.footer`
  background: linear-gradient(180deg, var(--bg1) 0%, #08090c 100%);
  border-top: 1px solid var(--line);
  color: var(--text-body);
  padding: 72px 24px 0;
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.1fr;
  gap: 48px;
  padding-bottom: 56px;
  border-bottom: 1px solid var(--line);

  @media (max-width: 800px) {
    grid-template-columns: 1fr 1fr;
    gap: 36px;
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const Brand = styled.div``;

const FooterLogo = styled.img`
  height: 52px;
  width: auto;
  margin-bottom: 18px;
  filter: brightness(0) invert(1);
  opacity: 0.85;
  transition: opacity var(--transition);

  &:hover { opacity: 1; }
`;

const Tagline = styled.p`
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-dim);
  max-width: 280px;
`;

const SocialRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 22px;
`;

const SocialBtn = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: 1.1rem;
  transition: background var(--transition), color var(--transition), transform var(--transition), border-color var(--transition);

  &:hover {
    background: var(--resin);
    border-color: var(--resin);
    color: #14110a;
    transform: translateY(-3px);
  }
`;

const Column = styled.div``;

const ColTitle = styled.h4`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-hi);
  margin-bottom: 20px;
`;

const NavList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NavItem = styled.li``;

const NavLink = styled(Link)`
  font-size: 0.9rem;
  color: var(--text-dim);
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: var(--resin-hot);
    padding-left: 4px;
  }
`;

const ContactItem = styled.a`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--text-dim);
  margin-bottom: 14px;
  transition: color var(--transition);

  svg {
    flex-shrink: 0;
    margin-top: 3px;
    color: var(--resin);
    transition: color var(--transition);
  }

  &:hover {
    color: var(--text-hi);
  }
`;

const CtaBanner = styled.div`
  position: relative;
  margin-top: 56px;
  padding: 36px 40px;
  background: var(--resin-grad);
  border-radius: var(--radius-lg);
  box-shadow: var(--glow-resin);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  overflow: hidden;

  @media (max-width: 700px) {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
  }
`;

const CtaText = styled.div`
  position: relative;

  h3 {
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #14110a;
    margin-bottom: 4px;
  }

  p {
    font-size: 0.9rem;
    color: rgba(20, 17, 10, 0.75);
  }
`;

const CtaButton = styled.button`
  position: relative;
  padding: 14px 32px;
  background: #14110a;
  color: var(--resin-hot);
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }
`;

const BottomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0;
  margin-top: 48px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.25);
`;

const LegalLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  a {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.3);
    transition: color var(--transition);

    &:hover {
      color: var(--resin-hot);
    }
  }
`;

const MadeBy = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  transition: color var(--transition);
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  img {
    height: 36px;
    width: auto;
    opacity: 0.5;
    transition: opacity var(--transition);
  }

  &:hover img {
    opacity: 0.8;
  }
`;

const Footer = () => {
  const scrollToContact = useCallback(() => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <FooterEl>
      <Inner>
        <TopGrid>
          <Brand>
            <FooterLogo
              src={`${process.env.PUBLIC_URL}/nextlevellogo.png`}
              alt="Next Level Epoxy Flooring"
            />
            <Tagline>
              New Mexico's premier epoxy flooring company — serving Albuquerque, Santa Fe, and surrounding areas with lifetime-guaranteed floors.
            </Tagline>
            <SocialRow>
              <SocialBtn
                href="https://www.instagram.com/nextlevelepoxynm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </SocialBtn>
            </SocialRow>
          </Brand>

          <Column>
            <ColTitle>Services</ColTitle>
            <NavList>
              <NavItem><NavLink to="/">Residential</NavLink></NavItem>
              <NavItem><NavLink to="/commercial">Commercial</NavLink></NavItem>
              <NavItem><NavLink to="/garagemakeover">Garage Makeover</NavLink></NavItem>
              <NavItem><NavLink to="/patios">Patio Coatings</NavLink></NavItem>
              <NavItem><NavLink to="/radon">Radon Mitigation</NavLink></NavItem>
              <NavItem><NavLink to="/careers">Careers</NavLink></NavItem>
            </NavList>
          </Column>

          <Column>
            <ColTitle>Service Areas</ColTitle>
            <NavList>
              <NavItem><NavLink to="/epoxy-flooring-albuquerque">Albuquerque Garage &amp; Concrete Coatings</NavLink></NavItem>
              <NavItem><NavLink to="/epoxy-flooring-santa-fe">Santa Fe Epoxy Floor Installers</NavLink></NavItem>
              <NavItem><NavLink to="/epoxy-flooring-rio-rancho">Rio Rancho Garage Floor Coatings</NavLink></NavItem>
            </NavList>
          </Column>

          <Column>
            <ColTitle>Contact</ColTitle>
            <ContactItem href="tel:5053524674" onClick={() => trackPhoneClick('footer')}>
              <FiPhone size={14} />
              505-352-4674
            </ContactItem>
            <ContactItem as="div" style={{ cursor: 'default' }}>
              <FiMapPin size={14} />
              Albuquerque, Santa Fe &amp; Rio Rancho, NM
            </ContactItem>
          </Column>
        </TopGrid>

        <CtaBanner>
          <CtaText>
            <h3>Ready to transform your floor?</h3>
            <p>Get a free, no-obligation quote in minutes.</p>
          </CtaText>
          <CtaButton onClick={scrollToContact}>Get a Free Quote →</CtaButton>
        </CtaBanner>

        <BottomBar>
          <Copyright>© {new Date().getFullYear()} Next Level Epoxy Flooring. All rights reserved.</Copyright>
          <LegalLinks>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </LegalLinks>
          <MadeBy href="https://codelabs88.com" target="_blank" rel="noopener noreferrer">
            Engineered with caffeine & code by
            <img src={codelabsLogo} alt="CodeLabs" />
          </MadeBy>
        </BottomBar>
      </Inner>
    </FooterEl>
  );
};

export default Footer;
