import React, { useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import emailjs from '@emailjs/browser';
import useScrollReveal from './useScrollReveal';

const MOBILE_MQ = '(max-width: 768px)';
const commercialMobileSrc  = { webm: '/videos/commercial-mobile.webm',  mp4: '/videos/commercial-mobile.mp4' };
const commercialDesktopSrc = { webm: '/videos/commercial-desktop.webm', mp4: '/videos/commercial-desktop.mp4' };

/* ── Keyframes ─────────────────────────────────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
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

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
`;

const checkDraw = keyframes`
  to { stroke-dashoffset: 0; }
`;

/* ── Hero Section ──────────────────────────────────────────────────── */
const HeroSection = styled.section`
  position: relative;
  height: 100dvh;
  height: 100vh;
  min-height: 600px;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    min-height: 100svh;
  }
`;

const HeroVideo = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(5, 15, 35, 0.55) 0%,
    rgba(5, 15, 35, 0.35) 50%,
    rgba(5, 15, 35, 0.6) 75%,
    #ffffff 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
`;

const HeroInner = styled.div`
  position: relative;
  z-index: 2;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  margin-bottom: 28px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  }
`;

const HeroHeadline = styled.h1`
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  font-weight: 800;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
`;

const HeroSub = styled.p`
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: rgba(255, 255, 255, 0.85);
  max-width: 640px;
  margin: 0 auto 36px;
  line-height: 1.65;
`;

const HeroCTA = styled.button`
  padding: 18px 48px;
  background: var(--accent);
  color: #1a1a2e;
  font-size: 1.1rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(240, 165, 0, 0.4);
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);

  &:hover {
    background: var(--accent-light);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(240, 165, 0, 0.5);
  }
`;


/* ── Section Shared ────────────────────────────────────────────────── */
const SectionContainer = styled.section`
  padding: 80px 24px;
  background: ${({ $bg }) => $bg || 'white'};
`;

const SectionInner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const SectionLabel = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 10px;
  text-align: center;
`;

const SectionHeading = styled.h2`
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 800;
  color: var(--text);
  text-align: center;
  margin-bottom: 14px;
  line-height: 1.15;
`;

const SectionSub = styled.p`
  font-size: 1.05rem;
  color: var(--text-mid);
  text-align: center;
  max-width: 620px;
  margin: 0 auto 50px;
  line-height: 1.6;
`;

/* ── Flooring Systems Grid ─────────────────────────────────────────── */
const SystemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
  }
`;

const SystemCard = styled.div`
  background: white;
  border-radius: var(--radius-md);
  padding: 32px 24px;
  border: 1px solid var(--border);
  transition: transform var(--transition), box-shadow var(--transition);
  text-align: left;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
`;

const SystemIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $color }) => $color || 'rgba(15, 76, 129, 0.08)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 1.4rem;
`;

const SystemTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
`;

const SystemDesc = styled.p`
  font-size: 0.9rem;
  color: var(--text-mid);
  line-height: 1.55;
`;

/* ── Industries ────────────────────────────────────────────────────── */
const IndustriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const IndustryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: white;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  transition: box-shadow var(--transition);

  &:hover {
    box-shadow: var(--shadow-sm);
  }
`;

const IndustryIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(15, 76, 129, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary);
`;

const IndustryName = styled.span`
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
`;

/* ── Process ───────────────────────────────────────────────────────── */
const ProcessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  counter-reset: step;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const ProcessStep = styled.div`
  text-align: center;
  position: relative;
  counter-increment: step;

  &::before {
    content: counter(step);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0 auto 16px;
  }
`;

const ProcessTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
`;

const ProcessDesc = styled.p`
  font-size: 0.88rem;
  color: var(--text-mid);
  line-height: 1.5;
`;

/* ── Why Us ─────────────────────────────────────────────────────────── */
const WhyUsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WhyUsCard = styled.div`
  background: white;
  border-radius: var(--radius-md);
  padding: 36px 28px;
  text-align: center;
  border: 1px solid var(--border);
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
`;

const WhyUsIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(15, 76, 129, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--primary);
`;

const WhyUsTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
`;

const WhyUsDesc = styled.p`
  font-size: 0.9rem;
  color: var(--text-mid);
  line-height: 1.55;
`;

/* ── Video Gallery ─────────────────────────────────────────────────── */
const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    gap: 20px;
  }
`;

const VideoCard = styled.div`
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background: #111;
  position: relative;
  transition: transform var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  video {
    width: 100%;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    display: block;
  }
`;

const VideoLabel = styled.p`
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  margin-top: 12px;
  line-height: 1.4;

  @media (max-width: 600px) {
    font-size: 0.85rem;
  }
`;

const LazyVideo = React.memo(({ webm, mp4 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video ref={ref} loop muted playsInline preload="metadata">
      {webm && <source src={webm} type="video/webm" />}
      {mp4  && <source src={mp4}  type="video/mp4" />}
    </video>
  );
});

/* ── Contact CTA Section ───────────────────────────────────────────── */
const CTASection = styled.section`
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
`;

const CTAInner = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  text-align: center;
`;

const CTAHeading = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: white;
  margin-bottom: 10px;
  line-height: 1.2;
`;

const CTASub = styled.p`
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

  svg { flex-shrink: 0; color: #4ade80; }
  span {
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
  }
`;

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

const FormLabel = styled.label`
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

  &::placeholder { color: #b0bac6; }
`;

const Input = styled.input`${inputBase}`;
const TextArea = styled.textarea`
  ${inputBase}
  resize: vertical;
  min-height: 80px;
`;
const Select = styled.select`${inputBase} cursor: pointer;`;

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
    &::after { animation: none; opacity: 0; }
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
  svg { flex-shrink: 0; color: #4ade80; }
`;

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

/* ── Data ──────────────────────────────────────────────────────────── */
const FLOORING_SYSTEMS = [
  {
    icon: '◆',
    color: 'rgba(15, 76, 129, 0.08)',
    title: 'Quartz Sand Broadcast',
    desc: 'Ultra-durable, slip-resistant surfaces ideal for high-traffic commercial areas. Withstands heavy machinery and chemical exposure.',
  },
  {
    icon: '✦',
    color: 'rgba(240, 165, 0, 0.1)',
    title: 'Decorative Flake',
    desc: 'Full-broadcast vinyl flake systems that hide imperfections while delivering a professional, high-end look for any facility.',
  },
  {
    icon: '▣',
    color: 'rgba(74, 222, 128, 0.1)',
    title: 'Urethane Cement',
    desc: 'The gold standard for food & beverage facilities. Thermal-shock resistant, handles extreme temps and aggressive washdowns.',
  },
  {
    icon: '◈',
    color: 'rgba(139, 92, 246, 0.1)',
    title: 'Metallic Epoxy',
    desc: 'Stunning, one-of-a-kind finishes for showrooms, lobbies, and retail. Each floor is a unique work of art.',
  },
  {
    icon: '▤',
    color: 'rgba(236, 72, 153, 0.08)',
    title: 'Self-Leveling Epoxy',
    desc: 'Seamless, high-gloss surfaces perfect for cleanrooms, labs, and pharmaceutical environments requiring easy sanitation.',
  },
  {
    icon: '◉',
    color: 'rgba(59, 130, 246, 0.08)',
    title: 'Polyaspartic Coatings',
    desc: 'Fast-cure systems that minimize downtime. Full installation in as little as one day — perfect for businesses that can\'t afford to stop.',
  },
];

const INDUSTRIES = [
  { name: 'Warehouses & Distribution', icon: 'W' },
  { name: 'Restaurants & Breweries', icon: 'R' },
  { name: 'Showrooms & Retail', icon: 'S' },
  { name: 'Medical & Pharmaceutical', icon: 'M' },
  { name: 'Manufacturing Plants', icon: 'P' },
  { name: 'Auto & Aviation Hangars', icon: 'A' },
  { name: 'Schools & Universities', icon: 'E' },
  { name: 'Government & Military', icon: 'G' },
];

const PROCESS_STEPS = [
  { title: 'Consultation', desc: 'We assess your facility, traffic patterns, and requirements to recommend the right system.' },
  { title: 'Custom Proposal', desc: 'Detailed scope of work, timeline, and transparent pricing — no hidden fees.' },
  { title: 'Installation', desc: 'Our crews work around your schedule to minimize downtime. Nights and weekends available.' },
  { title: 'Final Walkthrough', desc: 'We inspect every square foot with you and back it all with our commercial warranty.' },
];

const COMMERCIAL_VIDEOS = [
  { webm: '/videos/commercial1.webm', mp4: '/videos/commercial1.mp4', label: '8,500 sqft — National Guard Base, Santa Fe' },
  { webm: '/videos/commercial4.webm', mp4: '/videos/commercial4.mp4', label: '9,000 sqft — Kirtland AFB' },
  { webm: '/videos/commercial3.webm', mp4: '/videos/commercial3.mp4', label: '6,000 sqft Hangar — City of Grants' },
];

/* ── Component ─────────────────────────────────────────────────────── */
const Commercial = () => {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    user_email: '',
    user_number: '',
    facility_type: '',
    square_footage: '',
    area_desired: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches
  );
  const heroVideoRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (heroVideoRef.current) heroVideoRef.current.load();
  }, [isMobile]);

  const [heroRef, heroVisible] = useScrollReveal({ threshold: 0.1 });
  const [systemsRef, systemsVisible] = useScrollReveal({ threshold: 0.1 });
  const [industriesRef, industriesVisible] = useScrollReveal({ threshold: 0.1 });
  const [processRef, processVisible] = useScrollReveal({ threshold: 0.1 });
  const [whyRef, whyVisible] = useScrollReveal({ threshold: 0.1 });
  const [ctaRef, ctaVisible] = useScrollReveal({ threshold: 0.1 });
  const [galleryRef, galleryVisible] = useScrollReveal({ threshold: 0.05 });

  const isValid = form.contact_name && form.user_email && form.user_number && form.area_desired;

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
      .then(() => setSubmitted(true))
      .catch(() => alert('Something went wrong. Please try again or call us directly.'))
      .finally(() => setSending(false));
  };

  const scrollToCTA = () => {
    const el = document.getElementById('commercial-contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <HeroSection>
        <HeroVideo ref={heroVideoRef} autoPlay muted loop playsInline preload="auto">
          {(() => {
            const src = isMobile ? commercialMobileSrc : commercialDesktopSrc;
            return (
              <>
                <source src={src.webm} type="video/webm" />
                <source src={src.mp4} type="video/mp4" />
              </>
            );
          })()}
        </HeroVideo>
        <HeroOverlay>
          <HeroInner ref={heroRef} className={`reveal ${heroVisible ? 'visible' : ''}`}>
            <HeroBadge>Commercial Flooring Experts</HeroBadge>
            <HeroHeadline>
              Industrial-Grade Floors.<br />
              Built for Scale.
            </HeroHeadline>
            <HeroSub>
              From 500 sqft kitchens to 85,000+ sqft warehouses — we install every
              type of commercial floor coating with zero compromise on quality or timeline.
            </HeroSub>
            <HeroCTA onClick={scrollToCTA}>Get a Commercial Quote</HeroCTA>
          </HeroInner>
        </HeroOverlay>
      </HeroSection>


      {/* ── Flooring Systems ──────────────────────────────────────────── */}
      <SectionContainer $bg="white" style={{ paddingTop: '100px' }}>
        <SectionInner ref={systemsRef} className={`reveal ${systemsVisible ? 'visible' : ''}`}>
          <SectionLabel>Our Capabilities</SectionLabel>
          <SectionHeading>Every Commercial Flooring System</SectionHeading>
          <SectionSub>
            We're not a one-trick shop. Our team is trained and equipped to install any
            commercial-grade coating system your facility demands.
          </SectionSub>
          <SystemsGrid className="stagger">
            {FLOORING_SYSTEMS.map((s) => (
              <SystemCard key={s.title}>
                <SystemIcon $color={s.color}>{s.icon}</SystemIcon>
                <SystemTitle>{s.title}</SystemTitle>
                <SystemDesc>{s.desc}</SystemDesc>
              </SystemCard>
            ))}
          </SystemsGrid>
        </SectionInner>
      </SectionContainer>

      {/* ── Industries ────────────────────────────────────────────────── */}
      <SectionContainer $bg="var(--bg)">
        <SectionInner ref={industriesRef} className={`reveal ${industriesVisible ? 'visible' : ''}`}>
          <SectionLabel>Industries We Serve</SectionLabel>
          <SectionHeading>Trusted Across Every Sector</SectionHeading>
          <SectionSub>
            Whether it's a commercial kitchen that needs chemical resistance or a hangar
            that takes jet fuel spills — we've done it.
          </SectionSub>
          <IndustriesGrid className="stagger">
            {INDUSTRIES.map((ind) => (
              <IndustryItem key={ind.name}>
                <IndustryIcon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </IndustryIcon>
                <IndustryName>{ind.name}</IndustryName>
              </IndustryItem>
            ))}
          </IndustriesGrid>
        </SectionInner>
      </SectionContainer>

      {/* ── Why Us ────────────────────────────────────────────────────── */}
      <SectionContainer $bg="white">
        <SectionInner ref={whyRef} className={`reveal ${whyVisible ? 'visible' : ''}`}>
          <SectionLabel>Why Next Level</SectionLabel>
          <SectionHeading>What Sets Us Apart</SectionHeading>
          <SectionSub>
            Commercial flooring is high-stakes. Here's why facility managers and general
            contractors trust us with their largest projects.
          </SectionSub>
          <WhyUsGrid className="stagger">
            <WhyUsCard>
              <WhyUsIcon>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </WhyUsIcon>
              <WhyUsTitle>Commercial Warranty</WhyUsTitle>
              <WhyUsDesc>We stand behind every installation with a comprehensive warranty that covers materials and labor.</WhyUsDesc>
            </WhyUsCard>
            <WhyUsCard>
              <WhyUsIcon>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </WhyUsIcon>
              <WhyUsTitle>Minimal Downtime</WhyUsTitle>
              <WhyUsDesc>Night, weekend, and phased installs available. We work around your operations so you don't lose a single day of business.</WhyUsDesc>
            </WhyUsCard>
            <WhyUsCard>
              <WhyUsIcon>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </WhyUsIcon>
              <WhyUsTitle>Deep Expertise</WhyUsTitle>
              <WhyUsDesc>From USDA-compliant urethane cement to decorative metallic lobbies — our team knows every system inside and out.</WhyUsDesc>
            </WhyUsCard>
          </WhyUsGrid>
        </SectionInner>
      </SectionContainer>

      {/* ── Gallery ────────────────────────────────────────────────────── */}
      <SectionContainer $bg="var(--bg)">
        <SectionInner ref={galleryRef} className={`reveal ${galleryVisible ? 'visible' : ''}`}>
          <SectionLabel>Our Work</SectionLabel>
          <SectionHeading>Commercial Projects</SectionHeading>
          <SectionSub>
            See our commercial flooring installations in action — from prep to final coat.
          </SectionSub>
          <VideoGrid>
            {COMMERCIAL_VIDEOS.map((v, i) => (
              <div key={i}>
                <VideoCard>
                  <LazyVideo webm={v.webm} mp4={v.mp4} />
                </VideoCard>
                <VideoLabel>{v.label}</VideoLabel>
              </div>
            ))}
          </VideoGrid>
        </SectionInner>
      </SectionContainer>

      {/* ── Process ───────────────────────────────────────────────────── */}
      <SectionContainer $bg="white">
        <SectionInner ref={processRef} className={`reveal ${processVisible ? 'visible' : ''}`}>
          <SectionLabel>How It Works</SectionLabel>
          <SectionHeading>Simple Process, Serious Results</SectionHeading>
          <SectionSub>
            We make commercial flooring easy. Four steps from first call to finished floor.
          </SectionSub>
          <ProcessGrid className="stagger">
            {PROCESS_STEPS.map((step) => (
              <ProcessStep key={step.title}>
                <ProcessTitle>{step.title}</ProcessTitle>
                <ProcessDesc>{step.desc}</ProcessDesc>
              </ProcessStep>
            ))}
          </ProcessGrid>
        </SectionInner>
      </SectionContainer>

      {/* ── Contact CTA ───────────────────────────────────────────────── */}
      <CTASection id="commercial-contact">
        <CTAInner ref={ctaRef} className={`reveal ${ctaVisible ? 'visible' : ''}`}>
          <SectionLabel style={{ color: 'rgba(255,255,255,0.5)' }}>Free Commercial Estimate</SectionLabel>
          <CTAHeading>Let's Talk About Your Project</CTAHeading>
          <CTASub>Or call us directly:</CTASub>
          <PhoneLink href="tel:5053524674">505-352-4674</PhoneLink>

          <TrustBadges>
            <TrustBadge>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Commercial Warranty</span>
            </TrustBadge>
            <TrustBadge>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>85,000+ Sqft Projects</span>
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
                  Thanks for reaching out. A commercial specialist will contact you within
                  24 hours to discuss your project.<br />
                  For urgent inquiries, call <strong>505-352-4674</strong>.
                </SuccessText>
              </SuccessBox>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <CardHeader>
                  <CardTitle>Request a Commercial Quote</CardTitle>
                  <CardSubtitle>Tell us about your facility and we'll prepare a custom proposal.</CardSubtitle>
                </CardHeader>

                <Row>
                  <FieldGroup>
                    <FormLabel htmlFor="company_name">Company Name</FormLabel>
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      placeholder="Acme Industries"
                      value={form.company_name}
                      onChange={handleChange}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FormLabel htmlFor="contact_name">Contact Name *</FormLabel>
                    <Input
                      id="contact_name"
                      name="contact_name"
                      type="text"
                      placeholder="John Smith"
                      value={form.contact_name}
                      onChange={handleChange}
                      required
                    />
                  </FieldGroup>
                </Row>

                <Row>
                  <FieldGroup>
                    <FormLabel htmlFor="user_email">Email Address *</FormLabel>
                    <Input
                      id="user_email"
                      name="user_email"
                      type="email"
                      placeholder="john@company.com"
                      value={form.user_email}
                      onChange={handleChange}
                      required
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FormLabel htmlFor="user_number">Phone Number *</FormLabel>
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

                <Row>
                  <FieldGroup>
                    <FormLabel htmlFor="facility_type">Facility Type</FormLabel>
                    <Select
                      id="facility_type"
                      name="facility_type"
                      value={form.facility_type}
                      onChange={handleChange}
                    >
                      <option value="">Select type...</option>
                      <option value="warehouse">Warehouse / Distribution</option>
                      <option value="restaurant">Restaurant / Brewery</option>
                      <option value="retail">Retail / Showroom</option>
                      <option value="medical">Medical / Pharmaceutical</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="auto-aviation">Auto / Aviation</option>
                      <option value="education">Education</option>
                      <option value="government">Government / Military</option>
                      <option value="other">Other</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup>
                    <FormLabel htmlFor="square_footage">Approx. Square Footage</FormLabel>
                    <Input
                      id="square_footage"
                      name="square_footage"
                      type="text"
                      placeholder="e.g. 10,000 sqft"
                      value={form.square_footage}
                      onChange={handleChange}
                    />
                  </FieldGroup>
                </Row>

                <FieldGroup>
                  <FormLabel htmlFor="area_desired">Project Details *</FormLabel>
                  <TextArea
                    id="area_desired"
                    name="area_desired"
                    placeholder="Tell us about the space, any special requirements (chemical resistance, slip-resistance, etc.), and your preferred timeline..."
                    value={form.area_desired}
                    onChange={handleChange}
                    required
                  />
                </FieldGroup>

                <SubmitBtn type="submit" disabled={!isValid || sending}>
                  {sending ? 'Sending...' : 'Get My Commercial Quote →'}
                </SubmitBtn>
                <Note>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  We respond within 24 hours. Your info stays private — no spam, ever.
                </Note>
              </form>
            )}
          </Card>
        </CTAInner>
      </CTASection>
    </>
  );
};

export default Commercial;
