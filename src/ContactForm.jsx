import React, { useState } from 'react';
import styled from 'styled-components';
import emailjs from '@emailjs/browser'; // Import the EmailJS library

// Styled components for the Contact Form section
const ContactSection = styled.section`
  padding: 40px 20px; /* Reduced padding to make the component shorter */
  background-color: #0f4c81; /* Blue background */
  text-align: center;
  color: white; /* White text for contrast */
`;

const ContactHeading = styled.h2`
  font-size: 2rem; /* Reduced font size slightly */
  margin-bottom: 5px; /* Reduced margin for the heading */
  color: white; /* White heading */
`;

const Subheading = styled.h3`
  font-size: 1.3rem; /* Reduced font size slightly */
  margin-bottom: 20px; /* Reduced margin for the subheading */
  color: white; /* White subheading text */
`;

const Form = styled.form`
  max-width: 600px;
  margin: 0 auto;
  background-color: white; /* Form background white for contrast */
  padding: 20px; /* Reduced padding */
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Add a modern shadow effect */
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px; /* Reduced padding */
  margin-bottom: 12px; /* Reduced margin */
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: #0f4c81; /* Focus state for the input field */
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px; /* Reduced padding */
  margin-bottom: 12px; /* Reduced margin */
  font-size: 1rem;
  font-family: inherit; /* Ensure it inherits the font-family from parent */
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: #0f4c81; /* Focus state for the text area */
  }
`;

const SubmitButton = styled.button`
  background-color: #0f4c81;
  color: white;
  padding: 12px 25px; /* Reduced padding */
  font-size: 1.1rem; /* Reduced font size slightly */
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0a3356;
  }
`;

const ContactForm = () => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_number: '',
    area_desired: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Extracting form data manually
    const templateParams = {
      user_name: formData.user_name,
      user_email: formData.user_email,
      user_number: formData.user_number,
      area_desired: formData.area_desired
    };

    // Using EmailJS to send the form data manually
    emailjs.send(
      'service_mdak4yr',      // Your EmailJS Service ID
      'template_q5stpon',     // Your EmailJS Template ID
      templateParams,         // The collected form data
      'goz_UlnnNwQBQtTw4'       // Replace with your actual EmailJS Public Key
    )
    .then((result) => {
      console.log('Form successfully submitted:', result.text);
      setIsSubmitted(true); // Set submission status to true
    }, (error) => {
      console.error('There was an error submitting the form:', error);
      alert('Error: Unable to submit the form. Please try again later.');
    });
  };

  return (
    <ContactSection id="contact">
      <ContactHeading>Get A Free Quote!</ContactHeading>
      <Subheading>Call us today at 505-352-4674</Subheading> {/* New subheading */}
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
            rows="4" /* Adjusted rows to reduce height */
            placeholder="Area Desired (e.g. garage, basement, etc.)"
            value={formData.area_desired}
            onChange={handleChange}
            required
          />
          <SubmitButton type="submit">Submit</SubmitButton>
        </Form>
      ) : (
        <h3>Thank you! Your message has been sent. We will contact you soon.</h3>
      )}
    </ContactSection>
  );
};

export default ContactForm;
