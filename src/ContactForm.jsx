import React, { useState, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import useScrollReveal from './useScrollReveal';
import { trackFormSubmission, trackPhoneClick } from './lib/analytics';
import TurnstileWidget from './components/TurnstileWidget';
import { ConcreteTexture } from './accents';

// Turnstile only gates submits when the site key is baked into the build;
// without it the widget renders null and the form works as it always did.
const TURNSTILE_ACTIVE = !!process.env.REACT_APP_TURNSTILE_SITE_KEY;

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
  0%   { box-shadow: 0 4px 20px rgba(240, 165, 0, 0.25); }
  50%  { box-shadow: 0 4px 40px rgba(240, 165, 0, 0.4), 0 0 0 6px rgba(240, 165, 0, 0.08); }
  100% { box-shadow: 0 4px 20px rgba(240, 165, 0, 0.25); }
`;

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  padding: var(--section-pad) 24px;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  position: relative;
  overflow: hidden;
`;

const Inner = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
`;

const SectionLabel = styled.p`
  font-size: var(--fs-eyebrow);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--resin);
  margin-bottom: 14px;
`;

const Heading = styled.h2`
  font-size: var(--fs-h2);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-hi);
  margin-bottom: 10px;
  line-height: 1.2;
`;

const Subheading = styled.p`
  font-size: 1.1rem;
  color: var(--text-body);
  margin-bottom: 6px;
`;

const PhoneLink = styled.a`
  display: inline-block;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--resin-hot);
  margin-bottom: 12px;
  transition: opacity var(--transition);

  &:hover { opacity: 0.8; }
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
  background: rgba(24, 28, 34, 0.6);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);

  svg {
    flex-shrink: 0;
    color: var(--resin);
  }

  span {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-body);
    white-space: nowrap;
  }
`;

/* ── Form Card ────────────────────────────────────────────────────── */
const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  padding: 32px 40px;
  box-shadow: var(--shadow-dk-lg);
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
  color: var(--text-hi);
  margin-bottom: 6px;
`;

const CardSubtitle = styled.p`
  font-size: 0.92rem;
  color: var(--text-body);
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
  color: var(--text-hi);
  margin-bottom: 7px;
  letter-spacing: 0.03em;
`;

const inputBase = `
  width: 100%;
  padding: 12px 14px;
  font-size: 0.92rem;
  font-family: inherit;
  color: var(--text-hi);
  background: var(--bg0);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
  box-sizing: border-box;

  &:focus {
    border-color: var(--resin);
    box-shadow: 0 0 0 4px rgba(240, 165, 0, 0.14);
    background: #0e1014;
  }

  &::placeholder {
    color: var(--text-dim);
    opacity: 0.8;
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
  background: ${({ disabled }) => (disabled ? 'var(--surface-2)' : 'var(--resin-grad)')};
  color: ${({ disabled }) => (disabled ? 'var(--text-dim)' : '#14110a')};
  font-size: 1.05rem;
  font-weight: 700;
  border: ${({ disabled }) => (disabled ? '1px solid var(--line)' : 'none')};
  border-radius: var(--radius-full);
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);
  margin-top: 8px;
  position: relative;
  overflow: hidden;

  ${({ disabled }) => !disabled && css`
    animation: ${pulse} 3s ease-in-out infinite;
  `}

  &:hover:not(:disabled) {
    filter: brightness(1.07);
    transform: translateY(-2px);
    animation: none;
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
  }
`;

const Note = styled.p`
  font-size: 0.8rem;
  color: var(--text-dim);
  text-align: center;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  svg {
    flex-shrink: 0;
    color: var(--resin);
  }
`;

const ErrorMsg = styled.p`
  font-size: 0.85rem;
  color: #ffb4ab;
  background: rgba(147, 0, 10, 0.22);
  border: 1px solid rgba(255, 100, 90, 0.4);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 12px;
  text-align: center;
  font-weight: 600;
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
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.3);
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
  color: var(--text-hi);
`;

const SuccessText = styled.p`
  font-size: 0.95rem;
  color: var(--text-body);
  text-align: center;
  line-height: 1.6;
  max-width: 400px;

  strong {
    color: var(--text-hi);
  }
`;

/* ── Component ────────────────────────────────────────────────────── */
// `source` defaults to the home-page residential form. Pages that embed
// ContactForm with a more specific context should override (e.g. the
// GarageMakeover page passes "garage_makeover_form" so Bo's inbox
// distinguishes those leads from generic /contact submissions).
const ContactForm = ({ source = 'contact_form' }) => {
  const [form, setForm] = useState({
    user_name: '',
    user_email: '',
    user_number: '',
    area_desired: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sectionRef, sectionVisible] = useScrollReveal({ threshold: 0.1 });

  const isValid = form.user_name && form.user_email && form.user_number && form.area_desired;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setErrorMsg('');

    if (TURNSTILE_ACTIVE && !turnstileToken) {
      setErrorMsg('Please confirm you\'re human using the Cloudflare box above, then try again.');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.user_name,
          email: form.user_email,
          phone: form.user_number,
          area_desired: form.area_desired,
          source,
          turnstile_token: turnstileToken,
        }),
      });
      if (!res.ok) {
        // Any failed submit consumed the single-use Turnstile token — reset
        // the widget so the retry carries a fresh one (the 2026-07-18 bug was
        // re-POSTing a consumed token, 403-looping the customer).
        turnstileRef.current?.reset();
        if (res.status === 403) {
          setErrorMsg('Verification expired — please try again.');
          return;
        }
        // 400 (fixable input) and 429 (rate limit) carry actionable messages;
        // anything else gets the friendly fallback with the phone number.
        const body = await res.json().catch(() => null);
        const actionable = (res.status === 400 || res.status === 429) && body?.error;
        setErrorMsg(actionable ? body.error : 'We couldn\'t submit your request. Please try again or call 505-352-4674.');
        return;
      }
      trackFormSubmission('residential');
      setSubmitted(true);
      // Hand off to /thank-you for the Ads URL-match conversion.
      // Full reload so gtag('config', 'AW-...') re-fires cleanly.
      window.location.href = '/thank-you';
    } catch (err) {
      turnstileRef.current?.reset();
      setErrorMsg('We couldn\'t submit your request. Please try again or call 505-352-4674.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Section id="contact">
      <ConcreteTexture opacity={0.04} />
      <Inner ref={sectionRef} className={`reveal ${sectionVisible ? 'visible' : ''}`}>
        <SectionLabel>Free Estimate</SectionLabel>
        <Heading>Get Your Free Quote Today</Heading>
        <Subheading>Or call us directly:</Subheading>
        <PhoneLink href="tel:5053524674" onClick={() => trackPhoneClick('contact_section')}>505-352-4674</PhoneLink>

        <TrustBadges>
          <TrustBadge>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Lifetime Warranty</span>
          </TrustBadge>
          <TrustBadge>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>560+ Floors Done</span>
          </TrustBadge>
          <TrustBadge>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>100% Free — No Obligation</span>
          </TrustBadge>
        </TrustBadges>

        <Card>
          {submitted ? (
            <SuccessBox>
              <CheckCircle>
                <svg viewBox="0 0 24 24" aria-hidden="true">
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
            <form onSubmit={handleSubmit} method="post" noValidate>
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

              <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />

              {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}

              <SubmitBtn type="submit" disabled={!isValid || sending || (TURNSTILE_ACTIVE && !turnstileToken)}>
                {sending ? 'Sending…' : 'Get My Free Quote →'}
              </SubmitBtn>
              <Note>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
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
