import React, { useRef } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import flakeDiagram from './images/epoxydiagram1.webp';

import epoxy1 from './images/epoxyexample1.webp';
import epoxy2 from './images/onyx_cropped.webp';
import epoxy3 from './images/epoxyexample3.webp';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
  gap: 20px;

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
  gap: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    margin-bottom: 10px;
  }
`;

const InfoImage = styled.img`
  width: 50%;
  height: 400px;
  object-fit: contain;
  border-radius: 8px;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
  }
`;

const SliderWrapper = styled.div`
  position: relative;
  width: 40%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 60px;
  margin-right: 30px;

  .slick-slider,
  .slick-list,
  .slick-track,
  .slick-slide,
  .slick-slide > div {
    height: 100% !important;
  }

  .slick-dots {
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
  }

  .slick-dots li button:before {
    color: #0f4c81;
    font-size: 7px;
  }

  .image-box {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }

  @media (max-width: 768px) {
    width: 85vw;
    height: 300px;
    margin-top: 0px;
      margin-right: 0px;
          margin-bottom: 20px;
  }
`;



const InfoText = styled.p`
  font-size: 1.2rem;
  max-width: 80vw;
  line-height: 1.6;
  text-align: left;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    margin-top: -10px;
  }
`;

const InfoHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 0px;
  margin-top: 40px;
  color: #0f4c81;
  text-align: center;
  width: 80vw;

  @media (max-width: 768px) {
    margin-bottom: -10px;
  }
`;

const settings = {
  dots: true,
  appendDots: dots => <ul style={{ margin: "0px" }}>{dots}</ul>,
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
  const sliderRef = useRef(null);

  const handleSliderClick = (e) => {
    if (e.target.closest('.slick-dots')) return;
    const sliderRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - sliderRect.left;
    const halfWidth = sliderRect.width / 2;
    if (clickX < halfWidth) {
      sliderRef.current.slickPrev();
    } else {
      sliderRef.current.slickNext();
    }
  };

  return (
    <InfoSection>
      <InfoHeading>Our Floors Last A Lifetime. Guaranteed.</InfoHeading>

      <MainContainer>
        <InfoContainer>
          <InfoImage src={flakeDiagram} alt="Flake Diagram Showing Epoxy System" />

          <SliderWrapper onClick={handleSliderClick}>
            <Slider ref={sliderRef} {...settings}>
              <div className="image-box">
                <img src={epoxy1} alt="Epoxy Example 1" />
              </div>
              <div className="image-box">
                <img src={epoxy2} alt="Epoxy Example 2" />
              </div>
              <div className="image-box">
                <img src={epoxy3} alt="Epoxy Example 3" />
              </div>
            </Slider>
          </SliderWrapper>
        </InfoContainer>

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
