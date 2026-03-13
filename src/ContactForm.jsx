import React, { useState } from 'react';
import styled from 'styled-components';
import emailjs from '@emailjs/browser';
import logo from './images/nextlevellogo.webp'; // Import the company logo

// Styled components for the Contact Form section
const ContactSection = styled.section`
  padding: 40px 20px;
  background-color: #0f4c81;
  text-align: center;
  color: white;
`;
const NoticeMessage = styled.p`
  font-size: 0.9rem;
  color: #ffcc00;
  margin-bottom: 20px;
`;

const ContactHeading = styled.h2`
  font-size: 3rem;
  margin-bottom: 5px;
  color: white;
`;

const Subheading = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: white;
`;

const Form = styled.form`
  max-width: 600px;
  margin: 0 auto;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  &:focus {
    border-color: #0f4c81;
  }
  &:invalid {
    border-color: gray;
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
  &:invalid {
    border-color: gray;
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
  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#ccc' : '#0a3356')};
  }
`;

const ThankYouMessage = styled.div`
  text-align: center;
  padding: 20px;
  background-color: white;
  color: #0f4c81;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
`;

const Logo = styled.img`
  width: 100px;
  margin-bottom: 15px;
`;

const ContactForm = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_number: '',
    area_desired: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateForm();
  };

  const validateForm = () => {
    const { user_name, user_email, user_number, area_desired } = formData;
    if (user_name && user_email && user_number && area_desired) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const templateParams = {
      user_name: formData.user_name,
      user_email: formData.user_email,
      user_number: formData.user_number,
      area_desired: formData.area_desired
    };

    emailjs.send(
      'service_mdak4yr',
      'template_q5stpon',
      templateParams,
      'goz_UlnnNwQBQtTw4'
    )
    .then((result) => {
      console.log('Form successfully submitted:', result.text);
      setIsSubmitted(true);
    }, (error) => {
      console.error('There was an error submitting the form:', error);
      alert('Error: Unable to submit the form. Please try again later.');
    });
  };

  return (
    <ContactSection id="contact">
      <ContactHeading>Get A Free Quote!</ContactHeading>
      <Subheading>Call us today at 505-352-4674</Subheading>
      <NoticeMessage>Please fill out all fields before submitting the form.</NoticeMessage>

      {!isSubmitted ? (
        <Form onSubmit={handleSubmit}>
          <InputField
            type="text"
            name="user_name"
            placeholder="Your Name"
            value={formData.user_name}
            onChange={handleChange}
            required
          />
          <InputField
            type="email"
            name="user_email"
            placeholder="Your Email"
            value={formData.user_email}
            onChange={handleChange}
            required
          />
          <InputField
            type="tel"
            name="user_number"
            placeholder="Your Phone Number"
            value={formData.user_number}
            onChange={handleChange}
            required
          />
          <TextArea
            name="area_desired"
            rows="4"
            placeholder="Area Desired (e.g. garage, basement, etc.)"
            value={formData.area_desired}
            onChange={handleChange}
            required
          />
          <SubmitButton type="submit" disabled={!isValid}>Submit</SubmitButton>
        </Form>
      ) : (
        <ThankYouMessage>
          <Logo src={logo} alt="Next Level Epoxy Flooring Logo" />
          <h3>Thank you for reaching out!</h3>
          <p>We have received your request and will contact you shortly.</p>
          <p>For urgent inquiries, call us at <strong>505-352-4674</strong>.</p>
        </ThankYouMessage>
      )}
    </ContactSection>
  );
};

export default ContactForm;
