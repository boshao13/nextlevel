import React from 'react';
import styled from 'styled-components';
import lifetimeWarrantySeal from './images/lifetimewarranty.png'; // Warranty Seal image
import recentProjectImage from './images/carfloor.webp'; // Recent project image

// Styled Components for the Warranty Page
const WarrantySection = styled.section`
  background-color: #0f4c81;
  color: white;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Top align content */
  width: 100vw;
  padding: 50px 20px;
`;

const WarrantyContainer = styled.div`
  display: flex;
  flex-direction: column; /* Header on top, then content */
  align-items: center;
  width: 80vw; 
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
`;

const WarrantyHeading = styled.h2`
  font-size: 2.5rem;
  margin-top: 10px;
  margin-bottom: 40px;
  text-align: center;
`;

// Desktop Content Container (two-column layout)
const DesktopContent = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

// Mobile Content Container (vertical stack)
const MobileContent = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 20px;
  }
`;

// Left Column for Desktop (warranty text)
const LeftColumn = styled.div`
  width: 60%;
  text-align: left;

  @media (max-width: 768px) {
    width: 90vw;
  }
`;

const WarrantyText = styled.p`
  font-size: 1.3rem;
  margin-top: 40px;  /* Extra space above the text on desktop */
  margin-bottom: 30px;
  line-height: 1.6;

  @media (max-width: 768px) {
    margin-top: 70px; /* Reduced top margin for mobile */
  }
`;

// Right Column for Desktop (seal and recent project)
const RightColumn = styled.div`
  width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    width: 90vw;
  }
`;

// Increased the warranty seal size by setting width to 200px
const WarrantySealImage = styled.img`
  width: 200px; /* Increased size */
  height: auto;
  display: block;
  margin: 0 auto 20px auto;

  @media (max-width: 768px) {
    margin-bottom: -30px; /* Negative margin for mobile view */
  }
`;

// Container for the recent project photo and caption
const RecentProjectContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WarrantyImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 15px;
  margin-top: 10px;
`;

const ImageCaption = styled.p`
  font-size: 0.9rem;
  color: #cccccc;
  text-align: center;
  margin-top: 10px;
  padding: 0 10px;
`;

// For Mobile, reuse a container for the warranty text
const MobileTextContainer = styled.div`
  text-align: left;
  width: 90vw;
`;

const Warranty = () => {
  return (
    <WarrantySection>
      <WarrantyContainer>
        <WarrantyHeading>Lifetime Warranty</WarrantyHeading>
        {/* Desktop View */}
        <DesktopContent>
          <LeftColumn>
            <WarrantyText>
              We're so confident in the quality and durability of our epoxy flooring system that we offer a lifetime warranty on every floor we install. When you choose Next Level Epoxy Flooring, you're not just getting a beautiful, durable floor—you're getting peace of mind.
            </WarrantyText>
            <WarrantyText>
              Our floors are built to last, and we stand behind them 100%. If anything goes wrong due to material defects or installation errors, we've got you covered. That's how sure we are about the quality of our product.
            </WarrantyText>
          </LeftColumn>
          <RightColumn>
            <WarrantySealImage src={lifetimeWarrantySeal} alt="Lifetime Warranty Seal" />
            <RecentProjectContainer>
              <WarrantyImage src={recentProjectImage} alt="Recent Project" />
              <ImageCaption>
                A recent project in Santa Fe, New Mexico, featuring our most popular color - Nightfall.
              </ImageCaption>
            </RecentProjectContainer>
          </RightColumn>
        </DesktopContent>
        {/* Mobile View */}
        <MobileContent>
          <WarrantySealImage src={lifetimeWarrantySeal} alt="Lifetime Warranty Seal" />
          <MobileTextContainer>
            <WarrantyText>
              We're so confident in the quality and durability of our epoxy flooring system that we offer a lifetime warranty on every floor we install. When you choose Next Level Epoxy Flooring, you're not just getting a beautiful, durable floor—you're getting peace of mind.
            </WarrantyText>
            <WarrantyText>
              Our floors are built to last, and we stand behind them 100%. If anything goes wrong due to material defects or installation errors, we've got you covered. That's how sure we are about the quality of our product.
            </WarrantyText>
          </MobileTextContainer>
          <RecentProjectContainer>
            <WarrantyImage src={recentProjectImage} alt="Recent Project" />
            <ImageCaption>
              A recent project in Santa Fe, New Mexico, featuring our most popular color - Nightfall.
            </ImageCaption>
          </RecentProjectContainer>
        </MobileContent>
      </WarrantyContainer>
    </WarrantySection>
  );
};

export default Warranty;
