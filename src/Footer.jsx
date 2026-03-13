import React from 'react';
import styled from 'styled-components';
import { FaInstagram, FaGamepad, FaSignInAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Styled Components for Footer Section
const FooterContainer = styled.footer`
  background-color: white;
  padding: 10px;
  text-align: center;
  color: #333;
  border-top: 1px solid #eee;
  height: 15vh;
  box-sizing: border-box;
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
    color: #d6249f;
  }
`;

const CopyrightText = styled.p`
  font-size: 0.8rem;
  color: #555;
  margin-top: 5px;
`;

const SnakeLink = styled(Link)`
  color: #0f4c81;
  font-size: 1.5rem;
  margin-top: 10px;
  text-decoration: none;
  display: inline-block;
  margin-right: 10px;

  &:hover {
    color: #ff4500; /* Change color on hover */
  }
`;

const LoginLink = styled(Link)`
  background-color: #0f4c81;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  padding: 8px 12px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background-color: #072c50;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterText>Follow us on Instagram!</FooterText>
      
      <InstagramLink href="https://www.instagram.com/nextlevelepoxynm" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <FaInstagram /> {/* Instagram Icon */}
      </InstagramLink>

      <SnakeLink to="/snake" aria-label="Play Snake">
        <FaGamepad /> {/* Game Icon for Snake */}
      </SnakeLink>


      <CopyrightText>Made by Bo © 2024</CopyrightText>
    </FooterContainer>
  );
};

export default Footer;
