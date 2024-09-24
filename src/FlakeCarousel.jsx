import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick'; // Import the react-slick carousel

// Importing images from the src/images directory
import Coyote from './images/Coyote.webp';
import Creekbed from './images/Creekbed.webp';
import Gravel from './images/Gravel.png';
import Loon from './images/Loon.png';
import Nightfall from './images/Nightfall.webp';
import Tidalwave from './images/Tidalwave.webp';
import Thyme from './images/Thyme.webp';
import Wombat from './images/Wombat.webp';

// Styled component for the carousel section
const CarouselSection = styled.section`
  padding: 50px 20px;
  background-color: white; /* Set background color to white */
  text-align: center;
  color: #0f4c81; /* Dark blue text color for headings and other elements */
  position: relative;

  /* Add gradient shading to the left and right sides */
  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 10%;
    height: 100%;
    z-index: 2;
    cursor: pointer;
  }

  /* Left gradient */
  &::before {
    left: 0;
    background: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
  }

  /* Right gradient */
  &::after {
    right: 0;
    background: linear-gradient(to left, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
  }
`;

const CarouselHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #0f4c81; /* Dark blue heading text */
`;

const CarouselSubheading = styled.p`
  font-size: 1.3rem;
  margin-bottom: 40px;
  color: #0f4c81; /* Dark blue subheading text */
`;

const StyledSlider = styled(Slider)`
  width: 70vw; /* Reduce the width of the slider */
  margin: 0 auto; /* Center the slider */
  
  .slick-slide img {
    margin: auto;
    width: 100%;
    height: auto;
    border-radius: 10px;
    cursor: pointer;
  }

  /* Style for the default arrows */
  .slick-prev, .slick-next {
    font-size: 0; /* Hide any default text (e.g., "Previous", "Next") */
    color: #0f4c81 !important; /* Set arrow color to blue */
    z-index: 1;
  }

  /* Style the arrows specifically (the chevrons) */
  .slick-prev:before, .slick-next:before {
    font-size: 2rem; /* Adjust arrow size */
    color: #0f4c81; /* Set arrow color to blue */
    content: '‹'; /* Ensure the correct arrow for "Previous" */
  }

  .slick-next:before {
    content: '›'; /* Ensure the correct arrow for "Next" */
  }
  
  .slick-dots {
    margin-top: 40px; /* Add margin above the dots */
  }

  .slick-dots li button:before {
    color: #0f4c81; /* Set the dots to dark blue */
  }
`;

const ColorTitle = styled.p`
  margin-top: 10px;
  font-size: 1.2rem;
  color: #0f4c81; /* Dark blue color for the titles */
`;

const FlakeCarousel = () => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Array of imported image variables with color names
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

  // Slick slider settings for the main carousel
  const settings = {
    dots: true, // Show dots under the images
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Number of images to show at once
    slidesToScroll: 1, // Number of images to scroll at once
    autoplay: true, // Enable autoplay
    autoplaySpeed: 3000, // Set autoplay speed
    arrows: true, // Enable default arrows
    beforeChange: (current, next) => setCurrentSlide(next), // Track the current slide
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
        },
      },
    ],
  };

  // Function to handle clicking on the left/right side images
  const handleImageClick = (index) => {
    // Calculate the index of the leftmost visible slide
    const leftmostIndex = currentSlide % images.length;

    // If the clicked image is the leftmost one, move back; otherwise, move forward
    if (index === leftmostIndex) {
      sliderRef.current.slickPrev(); // Move the carousel backward
    } else {
      sliderRef.current.slickNext(); // Move the carousel forward
    }
  };

  return (
    <CarouselSection>
      <CarouselHeading>The Most Important Decision Of Your Life.</CarouselHeading>
      
      {/* Subheading */}
      <CarouselSubheading>
        Choose your favorite flake color from our most popular selection below.
      </CarouselSubheading>

      {/* Main Image Carousel */}
      <StyledSlider ref={sliderRef} {...settings}>
        {images.map((item, index) => (
          <div key={index}>
            <img
              src={item.image}
              alt={`carousel image ${item.name}`}
              onClick={() => handleImageClick(index)} // Handle image click
            />
            {/* Display the color title below each image */}
            <ColorTitle>{item.name}</ColorTitle>
          </div>
        ))}
      </StyledSlider>
    </CarouselSection>
  );
};

export default FlakeCarousel;
