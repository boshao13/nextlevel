import React from 'react';
import styled from 'styled-components';
import { FaInstagram } from 'react-icons/fa'; // Import Instagram icon from react-icons

// Styled Components for Footer Section
const FooterContainer = styled.footer`
  background-color: white;
  padding: 10px;
  text-align: center;
  color: #333;
  border-top: 1px solid #eee;
  /* Remove height constraint and let content size dynamically */
  width: 100%; /* Ensure it spans full width */
  box-sizing: border-box; /* Include padding in the element's total width and height */
`;

const FooterText = styled.p`
  font-size: 1rem;
  margin-bottom: 5px;
`;

const InstagramLink = styled.a`
  color: #0f4c81;
  font-size: 1.5rem;
  margin-right: 10px;
  text-decoration: none;

  &:hover {
    color: #d6249f; /* Instagram gradient color on hover */
  }
`;

const CopyrightText = styled.p`
  font-size: 0.8rem;
  color: #555;
  margin-top: 5px;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterText>Follow us on Instagram!</FooterText>
      
      <InstagramLink href="https://www.instagram.com/nextlevelepoxynm" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <FaInstagram /> {/* Instagram Icon */}
      </InstagramLink>

      <CopyrightText>Made by Bo © 2024</CopyrightText>
    </FooterContainer>
  );
};

export default Footer;
