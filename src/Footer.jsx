import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaInstagram, FaGamepad } from 'react-icons/fa';
import codelabsLogo from './images/codelabslogo.png';
import { FiPhone, FiMapPin, FiMail } from 'react-icons/fi';

const FooterEl = styled.footer`
  background: linear-gradient(180deg, #0a1628 0%, #060e1a 100%);
  color: rgba(255, 255, 255, 0.7);
  padding: 72px 24px 0;
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 56px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

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
  color: rgba(255, 255, 255, 0.45);
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  transition: background var(--transition), color var(--transition), transform var(--transition), border-color var(--transition);

  &:hover {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
    transform: translateY(-3px);
  }
`;

const Column = styled.div``;

const ColTitle = styled.h4`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: white;
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
  color: rgba(255, 255, 255, 0.45);
  transition: color var(--transition), padding-left var(--transition);

  &:hover {
    color: white;
    padding-left: 4px;
  }
`;

const ContactItem = styled.a`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 14px;
  transition: color var(--transition);

  svg {
    flex-shrink: 0;
    margin-top: 3px;
    color: var(--primary-light);
    transition: color var(--transition);
  }

  &:hover {
    color: white;
    svg { color: white; }
  }
`;

const CtaBanner = styled.div`
  margin-top: 56px;
  padding: 36px 40px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 700px) {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
  }
`;

const CtaText = styled.div`
  h3 {
    font-size: 1.25rem;
    font-weight: 800;
    color: white;
    margin-bottom: 4px;
  }

  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const CtaButton = styled.button`
  padding: 14px 32px;
  background: white;
  color: var(--primary);
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

const BottomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0;
  margin-top: 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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

const EasterEgg = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.15);
  transition: color var(--transition);

  &:hover { color: rgba(255, 255, 255, 0.45); }
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
              <NavItem><NavLink to="/careers">Careers</NavLink></NavItem>
            </NavList>
          </Column>

          <Column>
            <ColTitle>Contact</ColTitle>
            <ContactItem href="tel:5053524674">
              <FiPhone size={14} />
              505-352-4674
            </ContactItem>
            <ContactItem as="div" style={{ cursor: 'default' }}>
              <FiMapPin size={14} />
              Albuquerque &amp; Santa Fe, NM
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
          <MadeBy href="https://codelabs88.com" target="_blank" rel="noopener noreferrer">
            Engineered with caffeine & code by
            <img src={codelabsLogo} alt="CodeLabs" />
          </MadeBy>
          <EasterEgg to="/snake" aria-label="Easter egg">
            <FaGamepad size={13} />
            psst…
          </EasterEgg>
        </BottomBar>
      </Inner>
    </FooterEl>
  );
};

export default Footer;
