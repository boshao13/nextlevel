import React, { useState } from 'react';
import styled from 'styled-components';

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
      const response = await fetch('https://formspree.io/f/mldgzpgp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Error submitting form. Please try again later.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('There was an issue submitting your application.');
    }

    setIsLoading(false);
  };

  return (
    <CareersContainer>
      <CareersHeading>Join Our Team</CareersHeading>
      <CareersSubheading>
        We're always looking for dedicated individuals to join our team. Fill out the form below to apply for a position.
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
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </SubmitButton>
        </Form>
      ) : (
        <p>Thank you for your application! We will review it and get back to you soon.</p>
      )}
    </CareersContainer>
  );
};

export default Careers;
