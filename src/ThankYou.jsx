import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

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
  margin-top: 50px;
  width: 100%;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: 2.6rem;
  color: #0f4c81;
  margin-bottom: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;

  @media (max-width: 600px) {
    font-size: 2rem;
  }
`;

const Message = styled.p`
  font-size: 1.15rem;
  line-height: 1.75;
  color: #333;
  margin-bottom: 28px;

  @media (max-width: 600px) {
    font-size: 1rem;
  }
`;

const PhoneLink = styled.a`
  color: #0f4c81;
  font-weight: 700;
  text-decoration: none;
  border-bottom: 2px solid rgba(15, 76, 129, 0.25);

  &:hover { border-bottom-color: #0f4c81; }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryBtn = styled(Link)`
  display: inline-block;
  padding: 12px 22px;
  font-size: 1rem;
  background-color: #0f4c81;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  transition: background 0.2s;

  &:hover { background-color: #0c3c66; }
`;

const SecondaryBtn = styled(Link)`
  display: inline-block;
  padding: 12px 22px;
  font-size: 1rem;
  background-color: white;
  color: #0f4c81;
  border: 2px solid #0f4c81;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  transition: background 0.2s;

  &:hover { background-color: rgba(15, 76, 129, 0.06); }
`;

const FooterNote = styled.footer`
  padding: 20px;
  text-align: center;
  font-size: 0.85rem;
  color: #888;
`;

const ThankYou = () => {
  // Belt-and-suspenders: forms redirect via window.location.href so the page
  // reloads fully and gtag('config', 'AW-11478525428') in index.html re-fires
  // on the /thank-you load — that's what triggers the Ads URL-match conversion.
  // This useEffect also explicitly sends a page_view scoped to the Ads
  // destination so a soft-nav arrival (e.g. internal link) still counts.
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: '/thank-you',
        page_title: 'Thank You',
        send_to: 'AW-11478525428',
      });
    }
  }, []);

  return (
    <PageWrapper>
      <Helmet>
        <title>Thanks — Next Level Epoxy</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <ContentWrapper>
        <Card>
          <Heading>Thanks — we got your request!</Heading>
          <Message>
            The Next Level Epoxy team will reach out within <strong>24 hours</strong>.<br />
            If it's urgent, call us directly at{' '}
            <PhoneLink href="tel:5053524674">(505) 352-4674</PhoneLink>.
          </Message>
          <ButtonRow>
            <PrimaryBtn to="/garagemakeover">View Garage Makeover</PrimaryBtn>
            <SecondaryBtn to="/">Back to Home</SecondaryBtn>
          </ButtonRow>
        </Card>
      </ContentWrapper>
      <FooterNote>© {new Date().getFullYear()} Next Level Epoxy Flooring</FooterNote>
    </PageWrapper>
  );
};

export default ThankYou;
