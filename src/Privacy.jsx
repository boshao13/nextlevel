import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import LegalLayout from './components/LegalLayout';

const Privacy = () => (
  <>
    <Helmet>
      <title>Privacy Policy | Next Level Epoxy Flooring</title>
      <meta name="description" content="How Next Level Epoxy Flooring collects, uses, and protects your information when you request a quote or browse nextlevelepoxynm.com." />
      <link rel="canonical" href="https://www.nextlevelepoxynm.com/privacy" />
      <meta property="og:title" content="Privacy Policy | Next Level Epoxy Flooring" />
      <meta property="og:url" content="https://www.nextlevelepoxynm.com/privacy" />
    </Helmet>
    <LegalLayout title="Privacy Policy" effectiveDate="June 11, 2026">
      <p>
        Next Level Epoxy Flooring ("we," "us") operates nextlevelepoxynm.com and provides
        epoxy and concrete coating services in Albuquerque, Santa Fe, Rio Rancho, and
        surrounding New Mexico communities. This policy explains what information we
        collect through this website, how we use it, and the choices you have.
      </p>

      <h2>Information You Provide</h2>
      <ul>
        <li><strong>Quote requests:</strong> your name, phone number, email address, and the project details you describe (for example, the area you'd like coated).</li>
        <li><strong>Career applications:</strong> your name, email, phone number, age, and relevant experience.</li>
        <li><strong>Calls and emails:</strong> information you share when you contact us directly.</li>
      </ul>

      <h2>Information Collected Automatically</h2>
      <ul>
        <li><strong>Analytics:</strong> we use Google Analytics to understand how visitors use the site (pages viewed, approximate location, device type). Google Analytics uses cookies.</li>
        <li><strong>Advertising measurement:</strong> we use Google Ads conversion tracking to measure whether our ads lead to quote requests or calls. This also uses cookies.</li>
        <li><strong>Spam protection:</strong> our forms use Cloudflare Turnstile, which processes technical signals from your browser to tell humans apart from bots. Turnstile is operated by Cloudflare under its own privacy policy.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To respond to your quote request, schedule a free estimate, and provide our services.</li>
        <li>To consider your application if you apply to work with us.</li>
        <li>To measure and improve our advertising and website.</li>
        <li>To keep business records we're required or reasonably need to keep.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We never sell your personal information. We share it only with the service
        providers that run this website and our business — Google (analytics and
        advertising), Cloudflare (spam protection), our email delivery provider, and
        our cloud hosting provider — and when the law requires it.
      </p>

      <h2>Cookies &amp; Your Choices</h2>
      <p>
        You can clear or block cookies in your browser settings. You can also opt out
        of personalized advertising at{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>{' '}
        and install the{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out add-on</a>.
        The site works fine without cookies — they only affect measurement.
      </p>

      <h2>Retention &amp; Your Rights</h2>
      <p>
        We keep quote and project records for as long as we reasonably need them for
        business and warranty purposes. You can ask us at any time to see, correct, or
        delete the personal information we hold about you — call{' '}
        <a href="tel:5053524674">505-352-4674</a> or email{' '}
        <a href="mailto:nextlevelepoxycoatings@gmail.com">nextlevelepoxycoatings@gmail.com</a>{' '}
        and we'll take care of it.
      </p>

      <h2>Security</h2>
      <p>
        We protect your information with industry-standard safeguards, including
        encrypted connections (HTTPS), access controls on our systems, and spam and
        abuse protection on our forms.
      </p>

      <h2>Children</h2>
      <p>This website is not directed at children under 13, and we do not knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>
        If we update this policy, we'll post the new version here with a new effective
        date.
      </p>

      <h2>Contact</h2>
      <p>
        Next Level Epoxy Flooring — Albuquerque, Santa Fe &amp; Rio Rancho, NM<br />
        Phone: <a href="tel:5053524674">505-352-4674</a><br />
        Email: <a href="mailto:nextlevelepoxycoatings@gmail.com">nextlevelepoxycoatings@gmail.com</a>
      </p>

      <p>
        See also our <Link to="/terms">Terms of Service</Link>.
      </p>
    </LegalLayout>
  </>
);

export default Privacy;
