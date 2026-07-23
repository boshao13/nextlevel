import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import { trackFormSubmission } from './lib/analytics';
import TurnstileWidget from './components/TurnstileWidget';

// Turnstile only gates submits when the site key is baked into the build;
// without it the widget renders null and the form works as it always did.
const TURNSTILE_ACTIVE = !!process.env.REACT_APP_TURNSTILE_SITE_KEY;

// Styled components for the Careers Page — dark showroom system
const CareersContainer = styled.section`
  padding: 40px 20px;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  text-align: center;
  color: var(--text-body);
`;

const CareersHeading = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  margin-top: 60px;
  color: var(--text-hi);
`;

const CareersSubheading = styled.p`
  font-size: 1.3rem;
  margin-bottom: 30px;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  color: var(--text-body);
`;

const Form = styled.form`
  max-width: 600px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  padding: 20px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dk-lg);
  text-align: left;
`;

const inputBase = `
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 12px;
  font-size: 1rem;
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

const InputField = styled.input`${inputBase}`;

const TextArea = styled.textarea`
  ${inputBase}
  resize: vertical;
`;

const ErrorMsg = styled.p`
  font-size: 0.85rem;
  color: #ffb4ab;
  background: rgba(147, 0, 10, 0.22);
  border: 1px solid rgba(255, 100, 90, 0.4);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
  text-align: center;
  font-weight: 600;
`;

const SubmitButton = styled.button`
  background: ${({ disabled }) => (disabled ? 'var(--surface-2)' : 'var(--resin-grad)')};
  color: ${({ disabled }) => (disabled ? 'var(--text-dim)' : '#14110a')};
  padding: 12px 25px;
  font-size: 1.1rem;
  font-weight: 700;
  border: ${({ disabled }) => (disabled ? '1px solid var(--line)' : 'none')};
  border-radius: var(--radius-full);
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: transform var(--transition), box-shadow var(--transition), filter var(--transition);
  display: block;
  margin: 20px auto;
  &:hover:not(:disabled) {
    filter: brightness(1.07);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(240, 165, 0, 0.4);
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
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (TURNSTILE_ACTIVE && !turnstileToken) {
      setErrorMsg('Please confirm you\'re human using the Cloudflare box above, then try again.');
      return;
    }

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
        setErrorMsg(actionable ? body.error : 'We couldn\'t submit your inquiry. Please try again or call 505-352-4674.');
        return;
      }
      trackFormSubmission('career');
      setIsSubmitted(true);
      window.location.href = '/thank-you';
    } catch (error) {
      console.error('Error:', error);
      turnstileRef.current?.reset();
      setErrorMsg('We couldn\'t submit your inquiry. Please try again or call 505-352-4674.');
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
        <Form onSubmit={handleSubmit} method="post">
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
          <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />
          {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}
          <SubmitButton type="submit" disabled={isLoading || (TURNSTILE_ACTIVE && !turnstileToken)}>
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
