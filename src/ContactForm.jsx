import React, { useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import emailjs from '@emailjs/browser';
import useScrollReveal from './useScrollReveal';

/* ── Keyframes ────────────────────────────────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
`;

const checkDraw = keyframes`
  to { stroke-dashoffset: 0; }
`;

const pulse = keyframes`
  0%   { box-shadow: 0 4px 20px rgba(15, 76, 129, 0.3); }
  50%  { box-shadow: 0 4px 40px rgba(15, 76, 129, 0.5), 0 0 0 6px rgba(15, 76, 129, 0.1); }
  100% { box-shadow: 0 4px 20px rgba(15, 76, 129, 0.3); }
`;

const shimmer = keyframes`
  0%   { left: -100%; }
  100% { left: 100%; }
`;

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  padding: 64px 24px;
  background: linear-gradient(160deg, #0a3356 0%, var(--primary) 40%, #0d3f6e 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -180px;
    right: -120px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.03);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -200px;
    left: -150px;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.02);
    pointer-events: none;
  }
`;

const Inner = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
`;

const SectionLabel = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 14px;
`;

const Heading = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: white;
  margin-bottom: 10px;
  line-height: 1.2;
`;

const Subheading = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
`;

const PhoneLink = styled.a`
  display: inline-block;
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  transition: opacity var(--transition);

  &:hover { opacity: 0.75; }
`;

/* ── Trust Badges ─────────────────────────────────────────────────── */
const TrustBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 36px;
  flex-wrap: wrap;
`;

const TrustBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);

  svg {
    flex-shrink: 0;
    color: #4ade80;
  }

  span {
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
  }
`;

/* ── Form Card ────────────────────────────────────────────────────── */
const Card = styled.div`
  background: white;
  border-radius: var(--radius-lg);
  padding: 32px 40px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  text-align: left;
  position: relative;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 24px 20px;
  }
`;

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 6px;
`;

const CardSubtitle = styled.p`
  font-size: 0.92rem;
  color: var(--text-mid);
  line-height: 1.5;
`;

const FieldGroup = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 7px;
  letter-spacing: 0.03em;
`;

const inputBase = `
  width: 100%;
  padding: 12px 14px;
  font-size: 0.92rem;
  font-family: inherit;
  color: var(--text);
  background: var(--bg);
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
  box-sizing: border-box;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(15, 76, 129, 0.1);
    background: white;
  }

  &::placeholder {
    color: #b0bac6;
  }
`;

const Input = styled.input`${inputBase}`;
const TextArea = styled.textarea`
  ${inputBase}
  resize: vertical;
  min-height: 80px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 14px 32px;
  background: ${({ disabled }) => (disabled ? '#c5d5e8' : 'var(--primary)')};
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background var(--transition), transform var(--transition);
  margin-top: 8px;
  position: relative;
  overflow: hidden;

  ${({ disabled }) => !disabled && css`
    animation: ${pulse} 3s ease-in-out infinite;
  `}

  &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    animation: ${shimmer} 3s ease-in-out infinite;
  }

  &:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-2px);
    animation: none;
    box-shadow: 0 8px 28px rgba(15, 76, 129, 0.4);

    &::after {
      animation: none;
      opacity: 0;
    }
  }
`;

const Note = styled.p`
  font-size: 0.8rem;
  color: var(--text-light);
  text-align: center;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  svg {
    flex-shrink: 0;
    color: #4ade80;
  }
`;

/* ── Success State ────────────────────────────────────────────────── */
const SuccessBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 0;
  animation: ${fadeIn} 0.6s ease both;
`;

const CheckCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(15, 76, 129, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${scaleIn} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;

  svg {
    width: 36px;
    height: 36px;

    polyline {
      stroke: #4ade80;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      stroke-dasharray: 50;
      stroke-dashoffset: 50;
      animation: ${checkDraw} 0.6s 0.3s ease forwards;
    }
  }
`;

const SuccessTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
`;

const SuccessText = styled.p`
  font-size: 0.95rem;
  color: var(--text-mid);
  text-align: center;
  line-height: 1.6;
  max-width: 400px;
`;

/* ── Component ────────────────────────────────────────────────────── */
const ContactForm = () => {
  const [form, setForm] = useState({
    user_name: '',
    user_email: '',
    user_number: '',
    area_desired: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sectionRef, sectionVisible] = useScrollReveal({ threshold: 0.1 });

  const isValid = form.user_name && form.user_email && form.user_number && form.area_desired;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSending(true);

    emailjs
      .send('service_mdak4yr', 'template_q5stpon', form, 'goz_UlnnNwQBQtTw4')
      .then(() => {
        setSubmitted(true);
      })
      .catch(() => {
        alert('Something went wrong. Please try again or call us directly.');
      })
      .finally(() => setSending(false));
  };

  return (
    <Section id="contact">
      <Inner ref={sectionRef} className={`reveal ${sectionVisible ? 'visible' : ''}`}>
        <SectionLabel>Free Estimate</SectionLabel>
        <Heading>Get Your Free Quote Today</Heading>
        <Subheading>Or call us directly:</Subheading>
        <PhoneLink href="tel:5053524674">505-352-4674</PhoneLink>

        <TrustBadges>
          <TrustBadge>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Lifetime Warranty</span>
          </TrustBadge>
          <TrustBadge>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>560+ Floors Done</span>
          </TrustBadge>
          <TrustBadge>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>100% Free — No Obligation</span>
          </TrustBadge>
        </TrustBadges>

        <Card>
          {submitted ? (
            <SuccessBox>
              <CheckCircle>
                <svg viewBox="0 0 24 24">
                  <polyline points="6 12 10 16 18 8" />
                </svg>
              </CheckCircle>
              <SuccessTitle>We got your message!</SuccessTitle>
              <SuccessText>
                Thanks for reaching out. We'll contact you within 24 hours to schedule your free estimate.<br />
                For urgent inquiries, call <strong>505-352-4674</strong>.
              </SuccessText>
            </SuccessBox>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <CardHeader>
                <CardTitle>Request a Free Quote</CardTitle>
                <CardSubtitle>Fill out the form and we'll get back to you within 24 hours.</CardSubtitle>
              </CardHeader>

              <Row>
                <FieldGroup>
                  <Label htmlFor="user_name">Full Name</Label>
                  <Input
                    id="user_name"
                    name="user_name"
                    type="text"
                    placeholder="Jane Smith"
                    value={form.user_name}
                    onChange={handleChange}
                    required
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="user_number">Phone Number</Label>
                  <Input
                    id="user_number"
                    name="user_number"
                    type="tel"
                    placeholder="(505) 000-0000"
                    value={form.user_number}
                    onChange={handleChange}
                    required
                  />
                </FieldGroup>
              </Row>

              <FieldGroup>
                <Label htmlFor="user_email">Email Address</Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.user_email}
                  onChange={handleChange}
                  required
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="area_desired">What area needs coating?</Label>
                <TextArea
                  id="area_desired"
                  name="area_desired"
                  placeholder="e.g. 2-car garage, basement, commercial warehouse…"
                  value={form.area_desired}
                  onChange={handleChange}
                  required
                />
              </FieldGroup>

              <SubmitBtn type="submit" disabled={!isValid || sending}>
                {sending ? 'Sending…' : 'Get My Free Quote →'}
              </SubmitBtn>
              <Note>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                We respond within 24 hours. Your info stays private — no spam, ever.
              </Note>
            </form>
          )}
        </Card>
      </Inner>
    </Section>
  );
};

export default ContactForm;
