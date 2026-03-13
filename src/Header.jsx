import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import logo from './images/nextlevellogo.webp';

// Styled Components for Header
const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: white;
  height: 80px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Logo = styled.img`
  height: 60px;
`;

const Nav = styled.nav`
  @media (max-width: 768px) {
    display: none;
  }

  ul {
    display: flex;
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin-left: 20px;
  }

  a {
    color: #333;
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.3s ease;

    &:hover {
      color: #0f4c81;
      text-decoration: underline;
    }
  }
`;

const MobileIcon = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    font-size: 2rem;
    cursor: pointer;
    position: absolute;
    right: 20px;
  }
`;

const MobileNav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: ${({ isOpen }) => (isOpen ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform 0.3s ease-in-out;
  z-index: 999;

  a {
    color: #333;
    text-decoration: none;
    font-size: 1.5rem;
    margin-bottom: 20px;
    transition: color 0.3s ease;

    &:hover {
      color: #0f4c81;
      text-decoration: underline;
    }
  }
`;

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollToContact: true } });
    } else {
      scrollToContact();
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (location.state && location.state.scrollToContact) {
      scrollToContact();
    }
  }, [location]);

  return (
    <>
      <HeaderContainer>
        <Link to="/">
          <Logo src={logo} alt="Next Level Epoxy Flooring Logo" />
        </Link>
        <Nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {/* <li><Link to="/shop">Shop</Link></li> */}
            <li><Link to="/commercial">Commercial</Link></li>
            <li><Link to="/careers">Careers</Link></li>
{/* <li><Link to="/radon">Radon</Link></li> */}

            <li><Link to="/garagemakeover">Garage Makeover</Link></li>
            <li>
              <a href="#contact" onClick={handleContactClick}>
                Contact Us
              </a>
            </li>
          </ul>
        </Nav>
        <MobileIcon onClick={toggleMenu}>
          {isOpen ? <IoMdClose /> : <FiMenu />}
        </MobileIcon>
      </HeaderContainer>
      
      {/* Mobile Navigation */}
      <MobileNav isOpen={isOpen}>
        <Link to="/" onClick={toggleMenu}>Home</Link>
        {/* <Link to="/shop" onClick={toggleMenu}>Shop</Link> */}
        <Link to="/commercial" onClick={toggleMenu}>Commercial</Link>
        <Link to="/careers" onClick={toggleMenu}>Careers</Link>
{/* <li><Link to="/radon">Radon</Link></li> */}

        <Link to="/garagemakeover" onClick={toggleMenu}>Garage Makeover</Link>
        <a href="#contact" onClick={handleContactClick}>Contact Us</a>
      </MobileNav>
    </>
  );
};

export default Header;
