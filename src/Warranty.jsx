import React from 'react';
import styled from 'styled-components';
import lifetimeWarrantySeal from './images/lifetimewarranty.png'; // Import the warranty seal

// Styled Components for the Warranty Page
const WarrantySection = styled.section`
  background-color: #0f4c81;
  color: white;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  padding: 50px 20px; /* Add padding for top and bottom */
`;

// Container to hold both text and image
const WarrantyContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80vw; 
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

// Box for warranty text
const WarrantyTextContainer = styled.div`
  width: 60%;
  text-align: left;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// Image for the lifetime warranty seal
const WarrantyImage = styled.img`
  width: 35%;
  height: auto;

  @media (max-width: 768px) {
    width: 60%;
    margin-top: 20px;
    padding-bottom: 30px; /* Add padding below the image for spacing */
  }
`;

const WarrantyHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
`;

const WarrantyText = styled.p`
  font-size: 1.3rem;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const Warranty = () => {
  return (
    <WarrantySection>
      <WarrantyContainer>
        <WarrantyTextContainer>
          <WarrantyHeading>Lifetime Warranty</WarrantyHeading>
          <WarrantyText>
            We're so confident in the quality and durability of our epoxy flooring system that we offer a lifetime warranty on every floor we install. When you choose Next Level Epoxy Flooring, you're not just getting a beautiful, durable floor—you're getting peace of mind.
          </WarrantyText>
          <WarrantyText>
            Our floors are built to last, and we stand behind them 100%. If anything goes wrong due to material defects or installation errors, we've got you covered. That's how sure we are about the quality of our product.
          </WarrantyText>
        </WarrantyTextContainer>
        
        {/* Lifetime Warranty Seal */}
        <WarrantyImage src={lifetimeWarrantySeal} alt="Lifetime Warranty Seal" />
      </WarrantyContainer>
    </WarrantySection>
  );
};

export default Warranty;
