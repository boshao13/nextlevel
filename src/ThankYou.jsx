'use client';

import React, { useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const PageWrapper = styled.div`
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
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
  background: var(--surface);
  border: 1px solid var(--line-strong);
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: var(--shadow-dk-lg);
  max-width: 600px;
  margin-top: 50px;
  width: 100%;
  text-align: center;
`;

const Heading = styled.h1`
  font-size: 2.6rem;
  color: var(--text-hi);
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
  color: var(--text-body);
  margin-bottom: 28px;

  strong {
    color: var(--text-hi);
  }

  @media (max-width: 600px) {
    font-size: 1rem;
  }
`;

const PhoneLink = styled.a`
  color: var(--resin-hot);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 2px solid rgba(240, 165, 0, 0.35);

  &:hover { border-bottom-color: var(--resin); }
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
  background: var(--resin-grad);
  color: #14110a;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
  }
`;

const SecondaryBtn = styled(Link)`
  display: inline-block;
  padding: 12px 22px;
  font-size: 1rem;
  background: rgba(18, 21, 26, 0.35);
  color: var(--text-hi);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.28);
  }
`;

const FooterNote = styled.footer`
  padding: 20px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-dim);
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
      <ContentWrapper>
        <Card>
          <Heading>Thanks — we got your request!</Heading>
          <Message>
            The Next Level Epoxy team will reach out within <strong>24 hours</strong>.<br />
            If it's urgent, call us directly at{' '}
            <PhoneLink href="tel:5053524674">(505) 352-4674</PhoneLink>.
          </Message>
          <ButtonRow>
            <PrimaryBtn href="/garagemakeover">View Garage Makeover</PrimaryBtn>
            <SecondaryBtn href="/">Back to Home</SecondaryBtn>
          </ButtonRow>
        </Card>
      </ContentWrapper>
      <FooterNote>© {new Date().getFullYear()} Next Level Epoxy Flooring</FooterNote>
    </PageWrapper>
  );
};

export default ThankYou;
