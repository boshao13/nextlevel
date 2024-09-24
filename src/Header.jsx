import React from 'react';
import styled from 'styled-components';
import logo from './images/nextlevellogo.png'; // Import the logo image

// Styled Components for Header
const HeaderContainer = styled.header`
  position: absolute; /* Absolute position to overlay on hero */
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: white;
  height: 80px; /* Set the height of the header */
  z-index: 2; /* Ensure header is above the video */
`;

const Logo = styled.img`
  height: 60px; /* Adjust the logo size, fits well inside 80px header */
`;

const Nav = styled.nav`
  margin-left: auto; /* Pushes the navigation to the right */
  
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
    color: #333; /* Color of the links */
    text-decoration: none;
    font-size: 1rem; /* Adjust the font size of the links */
    transition: color 0.3s ease; /* Smooth transition for hover effect */
    
    &:hover {
      color: #0f4c81; /* Change the link color on hover (blue) */
      text-decoration: underline;
    }
  }
`;

const Header = () => {
  // Function to handle smooth scrolling to the Contact Us section
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <HeaderContainer>
      <Logo src={logo} alt="Next Level Epoxy Flooring Logo" />
      <Nav>
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#shop">Shop</a></li>
          <li>
            {/* Instead of href, we trigger smooth scroll on click */}
            <a href="#contact" onClick={(e) => { 
              e.preventDefault(); // Prevents the default anchor behavior
              scrollToContact();  // Trigger smooth scrolling
            }}>
              Contact
            </a>
          </li>
        </ul>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
