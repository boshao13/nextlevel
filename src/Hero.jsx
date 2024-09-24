import React from 'react';
import styled from 'styled-components';
import backgroundVideo from './images/HeroStopMotion.mp4'; // Import the video file

// Styled Components for the Hero Section
const HeroSection = styled.section`
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1; /* Ensure HeroSection stays on top of the background */

  /* Background video */
  video {
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 100%;
    min-height: 100%;
    width: auto;
    height: auto;
    z-index: -1; /* Ensure video is in the background */
    transform: translate(-50%, -50%);
    object-fit: cover;
    filter: brightness(0.7); /* Optional: darken the video for better text contrast */
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 70px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0), white); 
    z-index: 0;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1; /* Ensure content stays above video */
  text-align: center;
  padding: 0 20px; /* Add padding for mobile responsiveness */

  h1 {
    font-size: 2.8rem; /* Adjust font size to fit in one line */
    margin-bottom: 20px;
    white-space: nowrap; /* Prevents text from wrapping to the next line */
  }

  p {
    font-size: 1.5rem;
    margin-bottom: 10px; /* Less space between the lines */
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem; /* Smaller size for mobile devices */
    }

    p {
      font-size: 1.2rem;
    }
  }
`;


const CTAButton = styled.button`
  display: inline-block;
  padding: 12px 25px; /* Slightly reduced padding to match new layout */
  background-color: #007BFF;
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold; /* Bold the font */
  border-radius: 30px; /* Increase the border-radius for rounder corners */
  border: none;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3; 
  }

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;


const Hero = () => {
  // Function to handle the smooth scrolling
  const handleScroll = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <HeroSection>
      <video autoPlay loop muted playsInline>
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <HeroContent>
        <h1>Get Your Floor Done Right</h1>
        <p>We install the best floors in Albuquerque</p>
        <p>That's a fact.</p>
        {/* Button triggers smooth scroll */}
        <CTAButton onClick={handleScroll}>Get a Quote</CTAButton>
      </HeroContent>
    </HeroSection>
  );
};

export default Hero;
