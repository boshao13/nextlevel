import React from 'react';
import styled from 'styled-components';
import Slider from 'react-slick'; // Import the react-slick carousel
import flakeDiagram from './images/epoxydiagram1.webp'; // Import the flake diagram
import lifetimeWarrantySeal from './images/lifetimewarranty.png'; // Import the warranty seal

// Example epoxy images (replace with your actual images)
import epoxy1 from './images/epoxyexample1.webp';
import epoxy3 from './images/epoxyexample3.webp';

// Styled Components for Epoxy Info Section
const InfoSection = styled.section`
  background-color: white;
  color: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
`;

const MainContainer = styled.div`
  width: 80vw;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px; /* Add a gap between flex items for spacing */
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const InfoContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px; /* Remove negative margin to avoid overlap */
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    margin-bottom: 40px; /* Add extra margin between stacked items */
  }
`;

const InfoImage = styled.img`
  width: 48%;
  height: 400px;
  object-fit: contain;
  border-radius: 8px;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    margin-bottom: 20px; /* Add space between image and slider on mobile */
  }
`;

const SliderWrapper = styled.div`
  width: 48%;
  height: 450px;
  border-radius: 8px;
  overflow: hidden;

  .slick-slide {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
  }
`;

const InfoText = styled.p`
  font-size: 1.2rem;
  max-width: 80vw;
  line-height: 1.6;
  text-align: left;
  margin-bottom: 20px; /* Add spacing between text blocks */
`;

const InfoHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 40px;
  margin-top: 40px;
  color: #0f4c81;
  text-align: center;
  width: 80vw;
`;

// Slider settings
const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: true,
  fade: false,
};

const EpoxyInfo = () => {
  return (
    <InfoSection>
      <InfoHeading>Our Floors Last A Lifetime. Guaranteed.</InfoHeading>

      <MainContainer>
        <InfoContainer>
          {/* Flake Diagram Image */}
          <InfoImage src={flakeDiagram} alt="Flake Diagram Showing Epoxy System" />

          {/* Epoxy Example Slideshow */}
          <SliderWrapper>
            <Slider {...settings}>
              <div><img src={epoxy1} alt="Epoxy Example 1" /></div>
              <div><img src={epoxy3} alt="Epoxy Example 2" /></div>
            </Slider>
          </SliderWrapper>
        </InfoContainer>

        {/* Detailed Description of the Epoxy Process */}
        <InfoText>
          At Next Level Epoxy Flooring, we use an advanced epoxy system that ensures durability, longevity, and beauty. Our process includes the following key elements:
        </InfoText>

        <InfoText>
          <strong>1. Surface Preparation:</strong> We begin by thoroughly preparing the concrete surface, which is critical for ensuring the epoxy adheres properly. This includes grinding the concrete to remove any surface imperfections, opening the pores of the concrete, and creating the ideal texture for epoxy application.
        </InfoText>

        <InfoText>
          <strong>2. Epoxy Base Layer:</strong> A thick layer of high-quality, 100% solid epoxy is applied to the prepared surface. This forms the foundation of our system, providing excellent adhesion and durability. Our epoxy resists chemicals, impacts, and abrasion, making it ideal for heavy traffic areas.
        </InfoText>

        <InfoText>
          <strong>3. Full Broadcast Vinyl Flake System:</strong> While the epoxy is still wet, we broadcast decorative vinyl flakes across the entire surface to create a beautiful and textured finish. These flakes add color, texture, and durability, ensuring a slip-resistant surface that looks amazing in any setting.
        </InfoText>

        <InfoText>
          <strong>4. Polyaspartic Clear Topcoat:</strong> To protect and seal the system, we apply a clear polyaspartic layer on top of the vinyl flakes. Polyaspartic is a high-performance, UV-resistant coating that prevents yellowing and provides exceptional durability. This topcoat not only protects the underlying layers but also adds a glossy, professional finish.
        </InfoText>

        <InfoText>
          This combination of high-quality materials and precise application techniques results in an epoxy flooring system that is built to last, resistant to chemicals, UV damage, and wear, making it perfect for both residential and commercial applications. Our commitment to quality ensures that your epoxy floor will maintain its beauty and functionality for years to come.
        </InfoText>
      </MainContainer>
    </InfoSection>
  );
};

export default EpoxyInfo;
