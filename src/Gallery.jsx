import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';

// Import new optimized videos (WebM & MP4)
import video4WebM from './videos/galleryvideo4-optimized.webm';
import video4MP4 from './videos/galleryvideo4-final.mp4';

import video5WebM from './videos/galleryvideo5-optimized.webm';
import video5MP4 from './videos/galleryvideo5-final.mp4';

import video6WebM from './videos/galleryvideo6-optimized.webm';
import video6MP4 from './videos/galleryvideo6-final.mp4';

// Import optimized images
import galleryImage1 from './images/gallery1-opt.webp';
import galleryImage2 from './images/gallery2-opt.webp';
import galleryImage3 from './images/gallery3-opt.webp';
import galleryImage4 from './images/arkose.webp';
import galleryImage5 from './images/gallery5-opt.webp';
import galleryImage6 from './images/gallery6-opt.webp';
import galleryImage7 from './images/gallery7-opt.webp';
import galleryImage0 from './images/onyxwide_optimized.webp';

// Styled Components
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
  width: 90vw;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;

  video {
    width: calc(33.333% - 13.333px);
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    loading: lazy;
  }

  @media (max-width: 1200px) {
    gap: 10px;
    video {
      width: calc(33.333% - 6.666px);
    }
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 15px;
    video {
      width: 100%;
      height: 70vh;
    }
  }

  @media (max-width: 600px) {
    video {
      height: 80vh;
    }
  }
`;

const CarouselWrapper = styled.div`
  width: 90vw;
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

  /* Hide arrows on mobile */
  @media (max-width: 768px) {
    .slick-prev, .slick-next {
      display: none !important;
    }
  }
`;

const SwipeText = styled.p`
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  margin-top: 20px;
  display: none;

  @media (max-width: 768px) {
    display: block; /* Show only on mobile */
  }
`;

// **Updated Carousel Settings - Tappable on Mobile**
const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: false,
  swipeToSlide: true, // Enables swiping/tapping
  touchMove: true, // Allows touch gestures

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
        arrows: false, // Hide arrows on mobile
      },
    },
  ],
};

// **Memoized Video Component with Intersection Observer**
const MemoizedVideo = React.memo(({ webmSrc, mp4Src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.5 } // Triggers when at least 50% of the video is visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <video ref={videoRef} loop muted playsInline preload="metadata">
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
});

const Gallery = () => {
  return (
    <GallerySection>
      <GalleryHeading>Watch The Magic</GalleryHeading>
      <GallerySubheading>
        A closer look at our professional epoxy flooring transformations.
      </GallerySubheading>

      <VideoWrapper>
        <MemoizedVideo webmSrc={video6WebM} mp4Src={video6MP4} />
        <MemoizedVideo webmSrc={video4WebM} mp4Src={video4MP4} />
        <MemoizedVideo webmSrc={video5WebM} mp4Src={video5MP4} />
      </VideoWrapper>

      {/* Carousel Section */}
      <CarouselWrapper>
        <Slider {...carouselSettings}>
{[
  galleryImage0,
    galleryImage4,
  galleryImage1,
  galleryImage2,
  galleryImage3,

  galleryImage5,
  galleryImage6,
  galleryImage7,
].map((img, index) => (
  <div key={index}><img src={img} alt={`Gallery Image ${index + 1}`} /></div>
))}

        </Slider>
        <SwipeText>Swipe or tap to view more</SwipeText>
      </CarouselWrapper>
    </GallerySection>
  );
};

export default Gallery;
