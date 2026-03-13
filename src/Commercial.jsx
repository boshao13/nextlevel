import React, { useState } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import { useNavigate } from 'react-router-dom';

// Media Imports
import beforeImage from './images/commercialepoxybefore.JPG';
import afterImage from './images/commercialepoxyafter.JPG';
import processDiagram from './images/commercialepoxydiagram.webp';
import img1 from './images/commercialepoxy1.webp';
import img2 from './images/commercialepoxy2.webp';
import img3 from './images/commercialepoxy3.webp';
import img4 from './images/commercialepoxy4.webp';
import img5 from './images/commercialepoxy5.webp';
import img6 from './images/commercialepoxy6.webp';
import video1 from './images/commercialepoxyvid1_optimized.mp4';
import video2 from './images/commercialepoxyvid2_optimized.mp4';

const CommercialContainer = styled.section`
  padding: 100px 20px 20px 20px;
  background-color: #f9f9f9;
  color: #0f4c81;
  text-align: center;
  overflow-x: hidden;
`;

const CommercialHeading = styled.h2`
  font-size: 2.7rem;
  font-weight: 700;
  margin-bottom: 25px;
  @media (max-width: 600px) {
    font-size: 2.2rem;
  }
`;

const CommercialSubheading = styled.p`
  font-size: 1.3rem;
  line-height: 1.6;
  text-align: center;
  max-width: 600px;
  margin: 0 auto 50px;
  color: #333;
  white-space: pre-line;

  @media (max-width: 600px) {
    font-size: 1rem;
    max-width: 80vw;
  }
`;


const ProcessImage = styled.img`
  max-width: 700px;
  width: 80%;
  margin: 0 auto 60px auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
`;

const DiagramCaption = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-top: -40px;
  margin-bottom: 60px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  @media (max-width: 600px) {
    font-size: 0.95rem;
    margin-top: -20px;
  }
`;

const BeforeAfterWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
  margin-bottom: 60px;
  img {
    width: 100%;
    max-width: 450px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  }
`;

const Label = styled.p`
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 10px;
  color: #444;
  @media (max-width: 600px) {
    font-size: 0.95rem;
  }
`;

const SectionHeader = styled.h3`
  font-size: 2.3rem;
  margin-bottom: 20px;
  color: #0f4c81;
  @media (max-width: 600px) {
    font-size: 1.8rem;
  }
`;

const SideBySideVideos = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
  margin-bottom: 60px;
  video {
    width: 100%;
    max-width: 430px;
    border-radius: 12px;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  }
`;

const CarouselWrapper = styled.div`
  width: 100%;
  margin: 0 auto 80px auto;
  overflow: hidden;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;

  .slick-slider {
    width: 90vw;
    touch-action: pan-y;

    @media (max-width: 768px) {
      width: 85vw;
    }
  }

  .slick-slide {
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slick-slide img {
    width: 100%;
    height: auto;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: transform 0.3s ease;
    pointer-events: auto;
    touch-action: manipulation;

    @media (max-width: 768px) {
      width: 85vw;
    }
  }

  .slick-slide:hover img {
    transform: scale(1.02);
  }

  .slick-dots {
    display: block !important;
    position: relative;
    bottom: -5px;
    margin-top: 12px;
  }

  .slick-dots li button:before {
    color: #0f4c81 !important;
    font-size: 10px;
    opacity: 0.75;
  }

  .slick-dots li.slick-active button:before {
    opacity: 1;
    color: #0f4c81 !important;
  }

  @media (max-width: 768px) {
    .slick-slide img {
      max-height: 550px;
    }
  }
`;

const ContactSection = styled.section`
  background-color: #ffffff;
  padding: 20px 20px 40px;
  text-align: center;
  border-top: 1px solid #ddd;
`;

const ContactHeader = styled.h3`
  font-size: 3rem;
  margin-bottom: 10px;
  color: #0f4c81;
  @media (max-width: 600px) {
    font-size: 1.8rem;
  }
`;

const ContactText = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  color: #444;
`;

const ContactForm = styled.form`
  max-width: 600px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
  input, textarea {
    padding: 14px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    width: 100%;
  }
  button {
    padding: 14px;
    font-size: 1.1rem;
    background-color: #0f4c81;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s ease;
    &:hover {
      background-color: #0c3c66;
    }
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }
`;

const imageGallerySettings = {
  dots: true,
  infinite: true,
  speed: 600,
  slidesToShow: 3,
  slidesToScroll: 1,
  centerMode: true,
  centerPadding: '0px',
  arrows: true,
  swipe: true,
  touchMove: true,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        arrows: true,
        centerMode: false,
        dots: true,
        swipe: true,
        touchMove: true,
      },
    },
  ],
};

const Commercial = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    area: '',
  });
  const [showWarning, setShowWarning] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setShowWarning(false);
  };

  const isFormValid = () =>
    formData.name && formData.phone && formData.email && formData.area;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    fetch(form.action, {
      method: form.method,
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    }).then((response) => {
      if (response.ok) {
        navigate('/thank-you');
      } else {
        alert('There was a problem submitting your form, please all fields are completed and make sure your email/phone is correct.');
      }
    });
  };

  return (
    <CommercialContainer>
<CommercialHeading>
  Unmatched Durability.<br />
  Custom Designs.<br />
  Built for Business.
</CommercialHeading>

      <CommercialSubheading>
        At NEXT LEVEL EPOXY FLOORING, we specialize in delivering long-lasting, low-maintenance, and cost-effective epoxy flooring solutions for commercial clients. From warehouses and showrooms to restaurants and medical facilities, our floors are tailored to meet the exact needs of your space. With over a dozen material options and custom designs available, our epoxy systems are built to last a lifetime while staying within budget.
      </CommercialSubheading>

      <ProcessImage src={processDiagram} alt="Our Commercial Epoxy Process Diagram" />
      <DiagramCaption>
        This step-by-step diagram explains how our epoxy floor systems are applied — from preparation to final coating.
      </DiagramCaption>

      <SectionHeader>Before & After Transformation</SectionHeader>
      <BeforeAfterWrapper>
        <div><img src={beforeImage} alt="Before Epoxy Installation" /><Label>Before</Label></div>
        <div><img src={afterImage} alt="After Epoxy Installation" /><Label>After</Label></div>
      </BeforeAfterWrapper>

      <SectionHeader>See the Results</SectionHeader>
      <SideBySideVideos>
        <video src={video1} autoPlay muted loop playsInline />
        <video src={video2} autoPlay muted loop playsInline />
      </SideBySideVideos>

      <SectionHeader>Gallery</SectionHeader>
      <CarouselWrapper>
        <Slider {...imageGallerySettings}>
          {[img4, img2, img3, img1, img5, img6].map((src, i) => (
            <div key={i}><img src={src} alt={`Gallery Epoxy ${i + 1}`} /></div>
          ))}
        </Slider>
      </CarouselWrapper>

      <ContactSection>
        <ContactHeader>Contact Us</ContactHeader>
        <ContactText>
          Call us directly at <strong>505-352-4674</strong><br />
          or fill out the form below and we’ll get back to you shortly.
        </ContactText>

        <ContactForm
          action="https://formspree.io/f/xjkyqvqk"
          method="POST"
          onSubmit={(e) => {
            if (!isFormValid()) {
              e.preventDefault();
              setShowWarning(true);
              return;
            }
            handleSubmit(e);
          }}
        >
          <input type="text" name="name" placeholder="Name / Company Name" value={formData.name} onChange={handleInputChange} required />
          <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} required />
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
          <input type="text" name="area" placeholder="Area Desired (e.g. Front Lobby)" value={formData.area} onChange={handleInputChange} required />
          <textarea name="message" placeholder="Optional message..." rows="4" onChange={handleInputChange} />
          {showWarning && (
            <p style={{ color: 'red', fontWeight: 500, marginTop: '-10px' }}>
              ⚠️ Please fill out all required fields before submitting.
            </p>
          )}
          <button type="submit" disabled={!isFormValid()}>Send Request</button>
        </ContactForm>
      </ContactSection>
    </CommercialContainer>
  );
};

export default Commercial;
