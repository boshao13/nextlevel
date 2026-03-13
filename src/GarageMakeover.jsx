// src/pages/GarageMakeover.jsx
import React from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import { Link } from 'react-router-dom';
import ContactForm from './ContactForm';

// Image imports
import beforeImg from './images/makeoverbefore.webp';
import afterImg from './images/makeoverafter.webp';
import img1 from './images/makeover1.webp';
import img2 from './images/makeover2.webp';
import img3 from './images/makeover3.webp';

// Video imports
import video1WebM from './videos/transformationvid1-optimized.webm';
import video2WebM from './videos/transformationvid2-optimized.webm';
import video3WebM from './videos/transformationvid3-optimized.webm';
import heroVideoWebM from './videos/makeoverhero.webm';

const HeroSection = styled.section`
  position: relative;
  height: 90vh;
  width: 100%;
  overflow: hidden;
  margin-top: 80px;
`;

const HeroVideo = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  z-index: 0;
`;

const HeroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 20px;
`;

const HeroSubheading = styled.p`
  font-size: 1.2rem;
  color: white;
  max-width: 700px;
  z-index: 2;
  margin-top: 0.5rem;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
`;

const ExploreMore = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.4rem;
  color: white;
  text-align: center;
  z-index: 2;
  animation: bounce 2s infinite;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);

  span {
    display: block;
    font-size: 2rem;
    line-height: 1;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translate(-50%, 0);
    }
    40% {
      transform: translate(-50%, 6px);
    }
    60% {
      transform: translate(-50%, 3px);
    }
  }
`;

const PageWrapper = styled.section`
  background-color: #fefefe;
  min-height: 100vh;
  color: #0f4c81;
  padding-bottom: 100px;
  margin-top: 60px;
`;

const Subheading = styled.p`
  font-size: 1.4rem;
  text-align: center;
  margin: 40px 0 20px;
`;

const Description = styled.p`
  font-size: 1.1rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 50px;
  line-height: 1.6;
`;

const VideoWrapper = styled.div`
  width: 90vw;
  margin: 0 auto 60px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;

  video {
    width: calc(33.333% - 13.333px);
    height: auto;
    aspect-ratio: 9 / 16;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 1024px) {
    video {
      width: 100%;
    }
    flex-direction: column;
  }
`;

const BeforeAfterWrapper = styled.div`
  width: 90vw;
  margin: 0 auto 60px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const BeforeAfterItem = styled.div`
  width: 48%;

  @media (max-width: 768px) {
    width: 100%;
  }

  img {
    width: 100%;
    border-radius: 10px;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const Label = styled.p`
  text-align: center;
  font-weight: bold;
  color: #0f4c81;
  margin-bottom: 10px;
  font-size: 1rem;
`;

const CarouselWrapper = styled.div`
  width: 90vw;
  margin: 0 auto 50px;

  .slick-slide img {
    margin: auto;
    width: 100%;
    max-height: 600px;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const GalleryText = styled.p`
  font-size: 1.1rem;
  text-align: center;
  margin: 40px auto 30px;
  max-width: 800px;
  color: #0f4c81;
`;

const ContactLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 40px;
  font-size: 1.2rem;
  text-decoration: underline;
  color: #0f4c81;
  font-weight: bold;

  &:hover {
    color: #093c6e;
  }
`;

const imageCarousel = [img1, img2, img3];

const imageSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
};

const GarageMakeover = () => {
  return (
    <>
      <HeroSection>
        <HeroVideo autoPlay muted loop playsInline>
          <source src={heroVideoWebM} type="video/webm" />
          Your browser does not support the video tag.
        </HeroVideo>
        <HeroOverlay>
          <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '2.2rem', textShadow: '2px 2px 6px rgba(0,0,0,0.7)' }}>
            Custom walls. Luxe lighting. Seamless epoxy. Welcome to your new garage.
          </h2>
          <HeroSubheading></HeroSubheading>
          <ExploreMore>
            Explore More
            <span>↓</span>
          </ExploreMore>
        </HeroOverlay>
      </HeroSection>

      <PageWrapper>
        <Subheading>
          Premium garage makeover packages for a clean, functional, and luxurious finish.
        </Subheading>
        <Description>
          Our complete garage makeover package includes wall painting, baseboard installation, custom overhead or recessed lighting, and high-end epoxy flooring. We turn dusty, dull garages into bright and stylish spaces you’ll actually want to use. Whether for storage, working, or showing off your ride — we've got you covered.
        </Description>

        <VideoWrapper>
          {[video1WebM, video2WebM, video3WebM].map((src, index) => (
            <video key={index} muted loop autoPlay playsInline preload="metadata">
              <source src={src} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          ))}
        </VideoWrapper>

        <BeforeAfterWrapper>
          <BeforeAfterItem>
            <Label>Before</Label>
            <img src={beforeImg} alt="Garage Makeover Before" />
          </BeforeAfterItem>
          <BeforeAfterItem>
            <Label>After</Label>
            <img src={afterImg} alt="Garage Makeover After" />
          </BeforeAfterItem>
        </BeforeAfterWrapper>

        <GalleryText>
          Check out our garage makeover gallery!
        </GalleryText>

        <CarouselWrapper>
          <Slider {...imageSettings}>
            {imageCarousel.map((img, index) => (
              <div key={index}>
                <img src={img} alt={`Garage Makeover ${index + 1}`} />
              </div>
            ))}
          </Slider>
        </CarouselWrapper>

        <ContactForm />
      </PageWrapper>
    </>
  );
};

export default GarageMakeover;
