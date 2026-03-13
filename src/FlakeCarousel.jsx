import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';

// Importing images from the src/images directory
import Coyote from './images/Coyote.webp';
import Creekbed from './images/Creekbed.webp';
import Gravel from './images/Gravel.webp';
import Loon from './images/Loon.webp';
import Nightfall from './images/Nightfall.webp';
import Tidalwave from './images/Tidalwave.webp';
import Thyme from './images/Thyme.webp';
import Wombat from './images/Wombat.webp';

// Styled component for the carousel section
const CarouselSection = styled.section`
  padding: 50px 20px;
  background-color: white;
  text-align: center;
  color: #0f4c81;
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 10%;
    height: 100%;
    z-index: 2;
    cursor: pointer;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
  }
`;

const CarouselHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #0f4c81;
`;

const CarouselSubheading = styled.p`
  font-size: 1.3rem;
  margin-bottom: 40px;
  color: #0f4c81;
`;

const StyledSlider = styled(Slider)`
  width: 70vw;
  margin: 0 auto;
  
  .slick-slide img {
    margin: auto;
    width: 100%;
    height: auto;
    border-radius: 10px;
    cursor: pointer;
  }

  .slick-prev, .slick-next {
    font-size: 0;
    color: #0f4c81 !important;
    z-index: 1;

    @media (max-width: 600px) {
      display: none; /* Hide arrows on mobile */
    }
  }

  .slick-prev:before, .slick-next:before {
    font-size: 3rem;
    color: #0f4c81;
    content: '‹';
  }

  .slick-next:before {
    content: '›';
  }
  
  .slick-dots {
    margin-top: 40px;
  }

  .slick-dots li button:before {
    color: #0f4c81;
  }

  @media (max-width: 600px) {
    width: 90vw; /* Set slider width to 90vw on mobile */
  }
`;

const ColorTitle = styled.p`
  margin-top: 10px;
  font-size: 1.2rem;
  color: #0f4c81;
`;

const FlakeCarousel = () => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = [
    { image: Coyote, name: 'Coyote' },
    { image: Creekbed, name: 'Creekbed' },
    { image: Gravel, name: 'Gravel' },
    { image: Loon, name: 'Loon' },
    { image: Nightfall, name: 'Nightfall' },
    { image: Tidalwave, name: 'Tidalwave' },
    { image: Thyme, name: 'Thyme' },
    { image: Wombat, name: 'Wombat' },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 3000,
    arrows: true, // Enable arrows by default
    beforeChange: (current, next) => setCurrentSlide(next),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false, // Disable arrows on mobile
        },
      },
    ],
  };

  // Function to handle clicking on the left/right side of an image
  const handleImageClick = (event, index) => {
    const imageWidth = event.target.clientWidth;
    const clickPosition = event.nativeEvent.offsetX;

    // Check if the click position is on the left or right side of the image
    if (clickPosition < imageWidth / 2) {
      sliderRef.current.slickPrev(); // Move the carousel backward
    } else {
      sliderRef.current.slickNext(); // Move the carousel forward
    }
  };

  return (
    <CarouselSection>
      <CarouselHeading>Choose Wisely</CarouselHeading>
      
      <CarouselSubheading>
        Pick your favorite flake color from our most popular selection below.
      </CarouselSubheading>

      <StyledSlider ref={sliderRef} {...settings}>
        {images.map((item, index) => (
          <div key={index}>
            <img
              src={item.image}
              alt={`carousel image ${item.name}`}
              onClick={(event) => handleImageClick(event, index)} // Handle left/right click
            />
            <ColorTitle>{item.name}</ColorTitle>
          </div>
        ))}
      </StyledSlider>
    </CarouselSection>
  );
};

export default FlakeCarousel;
