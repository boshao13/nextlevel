import React from 'react';
import styled, { keyframes } from 'styled-components';
import useScrollReveal from './useScrollReveal';

/* ── Keyframes ────────────────────────────────────────────────────── */
const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
`;

/* ── Data ─────────────────────────────────────────────────────────── */
const testimonials = [
  {
    name: 'Alexander Durham',
    location: 'Google Review',
    text: 'Next Level is really next level! Bo was great to talk to and explain all the services he provided. I had to do a reschedule and he was very accommodating. The work itself is awesome. The job went quick (day and an half) and my garage looked better than I imagined. I have already been recommending Next Level to friends and family!',
    rating: 5,
  },
  {
    name: 'Ken Pepin',
    location: 'Google Review',
    text: "I can't possibly express how great Next Level Epoxy Flooring is. The attention to detail, the quality of work, the integrity of the installers is all top notch. Bo and his team are terrific. And best of all, the pricing is super competitive with the \"big\" flooring companies. I highly recommend them for your epoxy coating projects!",
    rating: 5,
  },
  {
    name: 'Tina Ogle',
    location: 'Google Review',
    text: 'We had an amazing experience working with Next Level Epoxy. They were extremely knowledgeable and passionate about providing a coating that would last a lifetime. Bo guided us in choosing the best colors and flakes for our needs. There was great communication every step of the way, and the pricing was very reasonable. Bo and his team worked quickly and efficiently to complete the project. I would highly recommend their services!',
    rating: 5,
  },
];

/* ── Styled Components ────────────────────────────────────────────── */
const Section = styled.section`
  padding: 64px 24px;
  background: white;
  overflow: hidden;
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const SectionLabel = styled.p`
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 800;
  color: var(--text);
  margin-bottom: 16px;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.05rem;
  color: var(--text-mid);
  max-width: 480px;
  margin: 0 auto 36px;
  line-height: 1.7;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-width: 520px;
    margin: 0 auto;
  }
`;

const TestimonialCard = styled.div`
  background: var(--bg);
  border-radius: var(--radius-md);
  padding: 24px 24px;
  border: 1px solid var(--border);
  position: relative;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  /* Stagger reveal */
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.35s ease;
  transition-delay: ${({ $delay }) => $delay || '0s'};

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateY(0);
  `}

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  &::before {
    content: '"';
    position: absolute;
    top: 20px;
    right: 28px;
    font-size: 4rem;
    font-family: Georgia, serif;
    color: var(--primary);
    opacity: 0.08;
    line-height: 1;
    pointer-events: none;
  }
`;

const Stars = styled.div`
  display: flex;
  gap: 3px;
  margin-bottom: 10px;
`;

const Star = styled.span`
  color: #f59e0b;
  font-size: 1rem;
`;

const QuoteText = styled.p`
  font-size: 0.85rem;
  color: var(--text-mid);
  line-height: 1.6;
  margin-bottom: 16px;
  font-style: italic;
`;

const Author = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.p`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text);
`;

const AuthorLocation = styled.p`
  font-size: 0.78rem;
  color: var(--text-light);
`;

/* ── Bottom CTA ──────────────────────────────────────────────────── */
const CtaRow = styled.div`
  margin-top: 36px;
  text-align: center;
  animation: ${float} 4s ease-in-out infinite;

  /* Reveal */
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s;

  ${({ $visible }) => $visible && `
    opacity: 1;
    transform: translateY(0);
  `}
`;

const CtaText = styled.p`
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
`;

const CtaButton = styled.button`
  padding: 16px 36px;
  background: var(--primary);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(15, 76, 129, 0.35);
  }
`;

/* ── Component ────────────────────────────────────────────────────── */
const Testimonials = () => {
  const [headerRef, headerVisible] = useScrollReveal();
  const [gridRef, gridVisible] = useScrollReveal({ threshold: 0.1 });

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Section>
      <Inner>
        <div ref={headerRef} className={`reveal ${headerVisible ? 'visible' : ''}`}>
          <SectionLabel>What Our Customers Say</SectionLabel>
          <SectionTitle>Real Results, Real People</SectionTitle>
          <SectionSubtitle>
            Don't just take our word for it — hear from homeowners across New Mexico.
          </SectionSubtitle>
        </div>

        <Grid ref={gridRef}>
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} $visible={gridVisible} $delay={`${i * 0.15}s`}>
              <Stars>
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j}>★</Star>
                ))}
              </Stars>
              <QuoteText>{t.text}</QuoteText>
              <Author>
                <Avatar>{t.name.charAt(0)}</Avatar>
                <AuthorInfo>
                  <AuthorName>{t.name}</AuthorName>
                  <AuthorLocation>{t.location}</AuthorLocation>
                </AuthorInfo>
              </Author>
            </TestimonialCard>
          ))}
        </Grid>

        <CtaRow $visible={gridVisible}>
          <CtaText>Ready to transform your space?</CtaText>
          <CtaButton onClick={scrollToContact}>Get Your Free Quote →</CtaButton>
        </CtaRow>
      </Inner>
    </Section>
  );
};

export default Testimonials;
