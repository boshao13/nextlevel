import React, { useState } from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { trackFormSubmission } from './lib/analytics';

// Styled components for the Careers Page
const CareersContainer = styled.section`
  padding: 40px 20px;
  background-color: #f9f9f9;
  text-align: center;
  color: #0f4c81;
`;

const CareersHeading = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
  margin-top: 60px;
  color: #0f4c81;
`;

const CareersSubheading = styled.p`
  font-size: 1.3rem;
  margin-bottom: 30px;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Form = styled.form`
  max-width: 600px;
  margin: 0 auto;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  &:focus {
    border-color: #0f4c81;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  &:focus {
    border-color: #0f4c81;
  }
`;

const SubmitButton = styled.button`
  background-color: ${({ disabled }) => (disabled ? '#ccc' : '#0f4c81')};
  color: white;
  padding: 12px 25px;
  font-size: 1.1rem;
  border: none;
  border-radius: 5px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.3s ease;
  display: block;
  margin: 20px auto;
  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#ccc' : '#0a3356')};
  }
`;

const Careers = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    applicant_name: '',
    applicant_email: '',
    phone_number: '',
    age: '',
    relevant_experience: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.applicant_name,
          email: formData.applicant_email,
          phone: formData.phone_number,
          source: 'career_form',
          notes: `Age: ${formData.age}\nExperience: ${formData.relevant_experience}`,
        }),
      });
      if (!res.ok) throw new Error('Lead post failed');
      trackFormSubmission('career');
      setIsSubmitted(true);
      window.location.href = '/thank-you';
    } catch (error) {
      console.error('Error:', error);
      alert('There was an issue submitting your inquiry. Please try again or call us directly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CareersContainer>
      <Helmet>
        <title>Careers at Next Level Epoxy | Hiring Floor Installers in Albuquerque NM</title>
        <meta name="description" content="Join the Next Level Epoxy team — we're hiring floor installers and crew in Albuquerque & Santa Fe, NM. Apply online for current openings." />
        <link rel="canonical" href="https://www.nextlevelepoxynm.com/careers" />
        <meta property="og:title" content="Careers at Next Level Epoxy | Hiring in Albuquerque NM" />
        <meta property="og:description" content="Join the Next Level Epoxy team — floor installer and crew roles in Albuquerque & Santa Fe, NM." />
        <meta property="og:url" content="https://www.nextlevelepoxynm.com/careers" />
      </Helmet>
      <CareersHeading>Work With Us</CareersHeading>
      <CareersSubheading>
        We hire installers and crew year-round across Albuquerque and Santa Fe. Send us a quick note about yourself and we'll keep your info on file — even when we're not actively hiring, we revisit every inquiry when openings come up.
      </CareersSubheading>
      {!isSubmitted ? (
        <Form onSubmit={handleSubmit}>
          <InputField
            type="text"
            name="applicant_name"
            placeholder="Your Name"
            value={formData.applicant_name}
            onChange={handleChange}
            required
          />
          <InputField
            type="email"
            name="applicant_email"
            placeholder="Your Email"
            value={formData.applicant_email}
            onChange={handleChange}
            required
          />
          <InputField
            type="tel"
            name="phone_number"
            placeholder="Your Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
          <InputField
            type="text"
            name="age"
            placeholder="Your Age"
            value={formData.age}
            onChange={handleChange}
            required
          />
          <TextArea
            name="relevant_experience"
            rows="4"
            placeholder="Type of Relevant Experience"
            value={formData.relevant_experience}
            onChange={handleChange}
            required
          />
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Inquiry'}
          </SubmitButton>
        </Form>
      ) : (
        <p>Thank you for your application! We will review it and get back to you soon.</p>
      )}
    </CareersContainer>
  );
};

export default Careers;
