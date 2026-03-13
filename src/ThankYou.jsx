import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PageWrapper = styled.div`
  background: linear-gradient(145deg, #eef3f9, #ffffff);
  min-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
`;

const Card = styled.div`
  background-color: white;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin-top:50px;
  width: 100%;
  text-align: center;
    @media (max-width: 600px) {
    
  }
`;

const Heading = styled.h1`
  font-size: 2.8rem;
  color: #0f4c81;
  margin-bottom: 20px;
  font-weight: 700;

  @media (max-width: 600px) {
    font-size: 2.2rem;
  }
`;

const Message = styled.p`
  font-size: 1.3rem;
  line-height: 1.8;
  color: #333;
  margin-bottom: 30px;

  @media (max-width: 600px) {
    font-size: 1rem;
  }
`;

const PhoneNumber = styled.span`
  color: #0f4c81;
  font-weight: 600;
`;

const HomeButton = styled(Link)`
  display: inline-block;
  padding: 14px 26px;
  font-size: 1.1rem;
  background-color: #0f4c81;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.3s ease;

  &:hover {
    background-color: #0c3c66;
  }
`;

const Footer = styled.footer`
  padding: 20px;
  text-align: center;
  font-size: 0.9rem;
  color: #888;
`;

const ThankYou = () => {
  return (
    <PageWrapper>
      <ContentWrapper>
        <Card>
          <Heading>Thank You!</Heading>
          <Message>
            Thank you for submitting!<br />
            We’ve received your request and will be in touch within 24 hours. <br />
            If it’s urgent, feel free to call us directly at <PhoneNumber>505-352-4674</PhoneNumber>.
          </Message>
          <HomeButton to="/">← Back to Home</HomeButton>
        </Card>
      </ContentWrapper>
      <Footer>© {new Date().getFullYear()} Next Level Epoxy Flooring</Footer>
    </PageWrapper>
  );
};

export default ThankYou;
