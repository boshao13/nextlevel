// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import styled from 'styled-components';
// import backgroundVideo from './images/HeroStopMotion-optimized.mp4'; // Optimized MP4 video
// import backgroundVideo1 from './images/HeroStopMotion.webm'; // WebM version
// import iphoneHeroVideo from './images/iphonehero1-final.mp4'; // iPhone-optimized MP4 video

// // Styled Components for the Hero Section
// const HeroSection = styled.section`
//   position: relative;
//   height: 100vh;
//   width: 100%;
//   overflow: hidden;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   color: white;
//   z-index: 1; /* Ensure HeroSection stays on top of the background */

//   /* Background video */
//   video {
//     position: absolute;
//     top: 50%;
//     left: 50%;
//     min-width: 100%;
//     min-height: 100%;
//     width: auto;
//     height: auto;
//     z-index: -1; /* Ensure video is in the background */
//     transform: translate(-50%, -50%);
//     object-fit: cover;
//     filter: brightness(0.7); /* Optional: darken the video for better text contrast */
//     max-height: 80vh; /* Prevent excessive memory usage */
//   }

//   &::after {
//     content: '';
//     position: absolute;
//     bottom: 0;
//     left: 0;
//     width: 100%;
//     height: 70px;
//     background: linear-gradient(to bottom, rgba(0, 0, 0, 0), white); 
//     z-index: 0;
//   }
// `;

// const HeroContent = styled.div`
//   position: relative;
//   z-index: 1; /* Ensure content stays above video */
//   text-align: center;
//   padding: 0 20px; /* Add padding for mobile responsiveness */

//   h2 {
//     font-size: 2.8rem; /* Adjust font size to fit in one line */
//     margin-bottom: 20px;
//   }

//   p {
//     font-size: 1.5rem;
//     margin-bottom: 10px; /* Less space between the lines */
//   }

//   @media (max-width: 768px) {
//     h2 {
//       font-size: 2rem; /* Smaller size for mobile devices */
//     }

//     p {
//       font-size: 1.2rem;
//     }
//   }
// `;

// const CTAButton = styled.button`
//   display: inline-block;
//   padding: 12px 25px; /* Slightly reduced padding to match new layout */
//   background-color: #007BFF;
//   color: white;
//   text-decoration: none;
//   font-size: 1.2rem;
//   font-weight: bold; /* Bold the font */
//   border-radius: 30px; /* Increase the border-radius for rounder corners */
//   border: none;
//   cursor: pointer;
//   margin-top: 20px;
//   transition: background-color 0.3s ease;

//   &:hover {
//     background-color: #0056b3; 
//   }

//   @media (max-width: 768px) {
//     margin-top: 30px;
//   }
// `;

// const Hero = () => {
//   const [isIOS, setIsIOS] = useState(false);

//   // Detect if the user is on an iPhone/iPad/iPod
//   useEffect(() => {
//     setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
//   }, []);

//   // Use useCallback to memoize the smooth scrolling function
//   const handleScroll = useCallback(() => {
//     const contactSection = document.getElementById('contact');
//     if (contactSection) {
//       contactSection.scrollIntoView({
//         behavior: 'smooth',
//         block: 'start',
//       });
//     }
//   }, []);

//   // Use useMemo to memoize the correct video element based on device
//   const videoElement = useMemo(() => (
//     <video autoPlay loop muted playsInline preload="metadata">
//       {isIOS ? (
//         <source src={iphoneHeroVideo} type="video/mp4" />
//       ) : (
//         <>
//           <source src={backgroundVideo} type="video/mp4" />
//           <source src={backgroundVideo1} type="video/webm" />
//         </>
//       )}
//       Your browser does not support the video tag.
//     </video>
//   ), [isIOS]);

//   return (
//     <HeroSection>
//       {videoElement}
//       <HeroContent>
//         <h2>Get Your Floor Done Right</h2>
//         <p>We install the best epoxy floors in Albuquerque and Santa Fe.</p>
//         <p>That's a fact.</p>
//         <CTAButton onClick={handleScroll}>Get a Quote</CTAButton>
//       </HeroContent>
//     </HeroSection>
//   );
// };

// // Export the memoized component to prevent unnecessary re-renders
// export default React.memo(Hero);

import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import backgroundVideo from './videos/mainhero2-final.mp4';
import backgroundVideo1 from './videos/mainhero2-final.webm';

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
  z-index: 1;

  video {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    object-fit: cover;
    width: 100vw;
    height: 100vh;
    max-width: 100%;
    max-height: 100%;
    z-index: -1;
    filter: brightness(0.7);
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
  z-index: 1;
  text-align: center;
  padding: 0 20px;

  h2 {
    font-size: 2.8rem;
    margin-bottom: 20px;
  }

  p {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 2rem;
    }

    p {
      font-size: 1.2rem;
    }
  }
`;

const CTAButton = styled.button`
  display: inline-block;
  padding: 12px 25px;
  background-color: #007BFF;
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  margin-top: 50px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;

const Hero = () => {
  // Smooth scroll to contact section
  const handleScroll = useCallback(() => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <HeroSection>
      <video autoPlay loop muted playsInline preload="metadata">
        <source src={backgroundVideo1} type="video/webm" />
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <HeroContent>
        <h2>If Your Garage Could Talk, It’d Call Us.</h2>
        <p>We install the best epoxy floors in Albuquerque and Santa Fe.</p>
        <p>That's a fact.</p>
        <CTAButton onClick={handleScroll}>Get a Quote</CTAButton>
      </HeroContent>
    </HeroSection>
  );
};

export default React.memo(Hero);
