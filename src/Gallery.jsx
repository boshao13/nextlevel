import React from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';

// Import videos and images
import video1 from './videos/iphonevideo1.webm';
import video2 from './videos/iphonevideo2.webm';
import video3 from './videos/iphonevideo3.webm';  // Import the third video

import galleryImage1 from './images/gallery1.webp';
import galleryImage2 from './images/gallery2.webp';
import galleryImage3 from './images/gallery3.webp';
import galleryImage4 from './images/gallery4.webp';
import galleryImage5 from './images/gallery5.webp';
import galleryImage6 from './images/gallery6.webp';
import galleryImage7 from './images/gallery7.webp';

// Styled Components for the Gallery Section
const GallerySection = styled.section`
  padding: 20px 20px;
  background-color: white;
  text-align: center;
  color: #0f4c81;
`;

const GalleryHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #0f4c81;
`;

const GallerySubheading = styled.p`
  font-size: 1.3rem;
  margin-bottom: 40px;
  color: #0f4c81;
`;

const VideoWrapper = styled.div`
  width: 80vw;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px; /* Added gap between videos */

  video {
    width: 32%; /* Default width for larger screens */
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 1024px) {
    flex-direction: column; /* Stack videos vertically on smaller screens */
    gap: 15px; /* Reduce gap for mobile view */

    video {
      width: 100%; /* Full width for mobile */
      height: 60vh; /* Take up 60% of the viewport height */
    }
  }

  @media (max-width: 600px) {
    video {
      height: 50vh; /* Adjust height for smaller screens */
    }
  }
`;

const CarouselWrapper = styled.div`
  width: 80vw;
  margin: 0 auto;
  margin-top: 20px;
  margin-bottom: 50px;

  .slick-slide img {
    margin: auto;
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 10px;
    max-height: 600px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .slick-dots {
    margin-top: 40px;
  }

  .slick-dots li button:before {
    color: #0f4c81;
  }

  .slick-prev, .slick-next {
    font-size: 0;
    color: #0f4c81 !important;
    z-index: 1;
  }

  .slick-prev:before, .slick-next:before {
    font-size: 2rem;
    color: #0f4c81;
    content: '‹';
  }

  .slick-next:before {
    content: '›';
  }
`;

const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: true,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

const Gallery = () => {
  return (
    <GallerySection>
      <GalleryHeading>Watch The Magic</GalleryHeading>
      <GallerySubheading>
        A closer look at our professional epoxy flooring transformations.
      </GallerySubheading>

      {/* Video Section */}
      <VideoWrapper>
        <video src={video2} autoPlay loop muted playsInline />
        <video src={video3} autoPlay loop muted playsInline />
        <video src={video1} autoPlay loop muted playsInline />
      </VideoWrapper>

      {/* Carousel Section */}
      <CarouselWrapper>
        <Slider {...carouselSettings}>
          <div>
            <img src={galleryImage1} alt="Gallery Image 1" />
          </div>
          <div>
            <img src={galleryImage2} alt="Gallery Image 2" />
          </div>
          <div>
            <img src={galleryImage3} alt="Gallery Image 3" />
          </div>
          <div>
            <img src={galleryImage4} alt="Gallery Image 4" />
          </div>
          <div>
            <img src={galleryImage5} alt="Gallery Image 5" />
          </div>
          <div>
            <img src={galleryImage6} alt="Gallery Image 6" />
          </div>
          <div>
            <img src={galleryImage7} alt="Gallery Image 7" />
          </div>
        </Slider>
      </CarouselWrapper>
    </GallerySection>
  );
};

export default Gallery;
