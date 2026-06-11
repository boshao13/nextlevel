import React from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';


// Styled Components
const RadonContainer = styled.section`
  /* 100px padding + former 50px margin-top folded into padding so the fixed
     76px header clearance is unchanged and no light gap shows above the page */
  padding: 150px 20px 40px 20px;
  background: linear-gradient(160deg, #101318 0%, var(--bg1) 45%, #0e1116 100%);
  color: var(--text-body);
  text-align: center;
`;

const RadonHeading = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--text-hi);
  letter-spacing: -0.02em;
`;

const RadonSubheading = styled.p`
  font-size: 1.5rem;
  font-weight: 500;
  max-width: 900px;
  margin: 0 auto 50px;
  line-height: 1.6;
  color: var(--text-body);
`;

const RadonContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
  text-align: left;
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--text-body);

  h3 {
    color: var(--text-hi);
    margin-top: 24px;
  }

  strong {
    color: var(--text-hi);
  }
`;

const StoryBox = styled.p`
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid rgba(240, 165, 0, 0.45);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dk-sm);
  padding: 24px 28px;
  font-style: italic;
  color: var(--text-body);
  margin-top: 16px;
`;

const CallToActionSection = styled.section`
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dk-sm);
  color: var(--text-body);
  padding: 50px 20px;
  text-align: center;
  margin-top: 50px;
`;

const CallToActionHeading = styled.h3`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: var(--text-hi);
`;

const CallToActionText = styled.p`
  font-size: 1.3rem;
  margin-bottom: 30px;
  line-height: 1.6;

  strong {
    color: var(--resin-hot);
  }
`;

const ContactInfo = styled.p`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--resin-hot);
`;

const Radon = () => {
  return (
    <RadonContainer>
      <Helmet>
        <title>Radon Mitigation & Epoxy Floor Sealing Albuquerque NM | Next Level</title>
        <meta name="description" content="Protect your home from radon with Next Level's 4-layer epoxy floor sealing system. Serving Albuquerque, Santa Fe & Rio Rancho NM. Free quote: 505-352-4674." />
        <link rel="canonical" href="https://www.nextlevelepoxynm.com/radon" />
        <meta property="og:title" content="Radon Mitigation & Epoxy Floor Sealing Albuquerque NM | Next Level" />
        <meta property="og:description" content="Seal foundation cracks against radon with our 4-layer epoxy system. Serving Albuquerque & Santa Fe NM." />
        <meta property="og:url" content="https://www.nextlevelepoxynm.com/radon" />
      </Helmet>

      <RadonHeading>Eliminate Radon with Our Advanced Epoxy Flooring</RadonHeading>
      <RadonSubheading>
        Protect your home and family from radon exposure. Our four-layer epoxy system effectively seals foundation cracks, preventing radon infiltration.
      </RadonSubheading>

      <RadonContent>
        <p>
          Radon is an invisible, odorless gas that seeps into homes primarily through cracks in concrete foundations. Long-term exposure to radon can lead to serious health risks, including lung cancer. Areas all over New Mexico experience particularly high radon levels.
        </p>
        <p>
          Our <strong>four-layer epoxy system</strong> is designed to completely seal your foundation, creating a protective barrier that prevents radon from entering your home. This system not only provides superior protection against radon but also enhances the durability and longevity of your concrete surfaces.
        </p>
        <h3>Real Customer Success: Barbara B.'s Radon Story</h3>
        <StoryBox>
          Barbara B. from the East Mountains had a radon level of nearly <strong>10 pCi/L</strong>, far above the recommended safe limit. After installing our epoxy flooring, her radon levels dropped below <strong>1 pCi/L</strong>—ensuring a much safer living environment for her family. If you're facing similar concerns, we can help!
        </StoryBox>
      </RadonContent>

      {/* Call to Action */}
      <CallToActionSection>
        <CallToActionHeading>Get a Free Consultation Today!</CallToActionHeading>
        <CallToActionText>
          Protect your home from radon with professional epoxy flooring solutions. Call us at <strong>505-352-4674</strong> or email <strong>nextlevelepoxycoatings@gmail.com</strong> for a free quote.
        </CallToActionText>
        <ContactInfo>Phone: 505-352-4674 | Email: nextlevelepoxycoatings@gmail.com</ContactInfo>
      </CallToActionSection>
    </RadonContainer>
  );
};

export default Radon;
