import React from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { useForm, ValidationError } from '@formspree/react';

// Media: set to null until assets are added back
const makeover1 = null, makeover2 = null, makeover3 = null, makeoverVideo = null;

// SEO Metadata
const SEO = () => (
  <Helmet>
    <title>Garage Makeover Package | Next Level Epoxy Flooring</title>
    <meta name="description" content="Transform your garage with our complete makeover package. We handle painting, cabinet installation, baseboards, and stunning epoxy flooring." />
    <meta name="keywords" content="garage makeover, epoxy flooring, garage cabinets, garage renovation, Albuquerque, Santa Fe" />
    <meta name="author" content="Next Level Epoxy Flooring" />
  </Helmet>
);

// Styled Components
const MakeoverContainer = styled.section`
  padding: 100px 20px;
  background-color: #f9f9f9;
  text-align: center;
  color: #0f4c81;
`;

const MakeoverHeading = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 20px;
`;

const MakeoverDescription = styled.p`
  font-size: 1.5rem;
  max-width: 900px;
  margin: 0 auto 50px;
  line-height: 1.6;
  color: #333;
`;

const GalleryWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 40px 0;

  img {
    width: 30%;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const VideoWrapper = styled.div`
  margin: 40px auto;
  max-width: 800px;

  video {
    width: 100%;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FormWrapper = styled.div`
  background: #0f4c81;
  color: white;
  padding: 50px 20px;
  text-align: center;
  margin-top: 50px;
`;

const Form = styled.form`
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 1rem;
  border-radius: 5px;
  border: none;
`;

const TextArea = styled.textarea`
  padding: 10px;
  font-size: 1rem;
  border-radius: 5px;
  border: none;
  height: 100px;
`;

const SubmitButton = styled.button`
  padding: 12px 20px;
  background-color: white;
  color: #0f4c81;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f4f4f4;
  }
`;

const Makeover = () => {
  const [state, handleSubmit] = useForm("mzzbqelp");
  if (state.succeeded) {
    return <p>Thank you! We'll be in touch soon.</p>;
  }

  return (
    <MakeoverContainer>
      <SEO />
      <MakeoverHeading>Complete Garage Makeover Package</MakeoverHeading>
      <MakeoverDescription>
        Upgrade your garage with a full transformation. Our package includes painting, custom cabinet installation, baseboards, and a durable epoxy floor for a stunning finish.
      </MakeoverDescription>
      
      {/* Photo Gallery */}
      <GalleryWrapper>
        <img src={makeover1} alt="Garage Makeover 1" />
        <img src={makeover2} alt="Garage Makeover 2" />
        <img src={makeover3} alt="Garage Makeover 3" />
      </GalleryWrapper>

      {/* Video Gallery */}
      <VideoWrapper>
        <video controls>
          <source src={makeoverVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </VideoWrapper>

      {/* Custom Form */}
      <FormWrapper>
        <h2>Get a Free Consultation</h2>
        <Form onSubmit={handleSubmit}>
          <Input type="text" name="name" placeholder="Your Name" required />
          <ValidationError prefix="Name" field="name" errors={state.errors} />
          <Input type="email" name="email" placeholder="Your Email" required />
          <ValidationError prefix="Email" field="email" errors={state.errors} />
          <TextArea name="message" placeholder="Tell us about your project" required />
          <ValidationError prefix="Message" field="message" errors={state.errors} />
          <SubmitButton type="submit" disabled={state.submitting}>Send Inquiry</SubmitButton>
        </Form>
      </FormWrapper>
    </MakeoverContainer>
  );
};

export default Makeover;
