'use client';

import React from 'react';
import Link from 'next/link';
import LegalLayout from './components/LegalLayout';

const Accessibility = () => (
  <>
    <LegalLayout title="Accessibility Statement" effectiveDate="July 30, 2026">
      <p>
        Next Level Epoxy Flooring ("we," "us") wants nextlevelepoxynm.com to be
        usable by everyone, including people who browse with screen readers,
        keyboard-only navigation, screen magnification, or other assistive
        technology. This statement describes what we are aiming for, what we
        have actually tested, what we know is still not right, and how to reach
        a human if the site gets in your way.
      </p>

      <h2>Conformance Target</h2>
      <p>
        Our target is the{' '}
        <a href="https://www.w3.org/TR/WCAG21/" target="_blank" rel="noopener noreferrer">
          Web Content Accessibility Guidelines (WCAG) 2.1
        </a>{' '}
        at <strong>Level AA</strong>.
      </p>

      <h2>Conformance Status: Partial</h2>
      <blockquote>
        This website is <strong>partially conformant</strong> with WCAG 2.1
        Level AA. "Partially conformant" means some parts of the site do not yet
        fully meet the standard. We are not claiming full conformance, and this
        site has not been certified by anyone.
      </blockquote>
      <p>We want to be precise about what that claim rests on:</p>
      <ul>
        <li>
          <strong>What we tested:</strong> we run automated accessibility testing
          using <a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener noreferrer">axe-core</a>{' '}
          against the WCAG 2.0 and 2.1 A and AA rule sets across our public
          pages, including the home page, our service pages (commercial, garage
          makeover, patios, radon, polished concrete, color options), our
          Albuquerque, Santa Fe, and Rio Rancho service-area pages, the careers
          page, the blog index, and these legal pages.
        </li>
        <li>
          <strong>What that testing reports:</strong> as of the effective date
          above, axe-core reports no violations on the pages tested.
        </li>
        <li>
          <strong>What that does not mean:</strong> automated tools only catch a
          portion of real accessibility problems — commonly cited estimates put
          it at roughly a third. A page can pass every automated check and still
          be confusing or unusable with a screen reader. A clean automated
          report is a floor, not a finish line.
        </li>
        <li>
          <strong>What we have not finished:</strong> manual testing with screen
          readers and keyboard-only navigation is <strong>not yet complete</strong>.
          Until it is, we cannot responsibly claim more than partial
          conformance.
        </li>
      </ul>

      <h2>Known Gaps</h2>
      <p>These are the issues we are aware of today. This list is honest rather than flattering:</p>
      <ul>
        <li>
          <strong>Manual assistive-technology testing is pending.</strong> We
          have not yet completed a structured pass with screen readers (such as
          NVDA, JAWS, or VoiceOver) or a full keyboard-only walkthrough of every
          page and form.
        </li>
        <li>
          <strong>Third-party embeds we do not control.</strong> Our service-area
          pages embed a Google Maps frame, and our quote, commercial, and career
          forms use a Cloudflare Turnstile anti-spam challenge. These are
          rendered by outside providers; we cannot change their internal markup
          or behavior, and their accessibility is ultimately determined by those
          vendors. If one of them blocks you, contact us using the details below
          and we will complete your request directly.
        </li>
        <li>
          <strong>Autoplaying video has no visible pause control.</strong>{' '}
          Several pages start short, looping video automatically — some as a
          background behind the page content, some as footage of finished
          floors. None of it has audio, and none of it is the only place we
          tell you something: the background clips are decorative, and the
          project clips each carry a text description. But there is currently
          no on-screen button to pause or stop them. If your browser or
          operating system is set to reduce motion, the site honors that
          setting for its animations, transitions, and scroll effects — it does
          not yet stop these videos.
        </li>
        <li>
          <strong>Third-party links.</strong> We link out to sites we do not
          operate (for example Instagram). We are not responsible for their
          accessibility.
        </li>
      </ul>

      <h2>What We Have Done</h2>
      <ul>
        <li>Text and background colors on the site are checked against the WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text and interface boundaries).</li>
        <li>Interactive elements show a visible focus outline when navigated by keyboard.</li>
        <li>Images carry text alternatives, and decorative graphics are hidden from assistive technology so they are not read aloud as noise.</li>
        <li>The site respects the "reduce motion" preference set in your browser or operating system for its animations, transitions, and scroll effects (see the video note above for the exception).</li>
        <li>Embedded frames are given descriptive titles.</li>
      </ul>

      <h2>Feedback &amp; Getting Help</h2>
      <p>
        If any part of this website prevents you from finding information,
        requesting a quote, or applying for a job, please tell us. We treat that
        as a defect, not a complaint.
      </p>
      <ul>
        <li>Phone: <a href="tel:5053524674">505-352-4674</a></li>
        <li>Email: <a href="mailto:nextlevelepoxycoatings@gmail.com">nextlevelepoxycoatings@gmail.com</a></li>
      </ul>
      <p>
        Please tell us the page address and what went wrong, and give us a way
        to reach you. <strong>We aim to respond within 5 business days.</strong>
      </p>
      <blockquote>
        If something on this site is not accessible to you, we will supply the
        same information another way — over the phone, by email, or in another
        format you ask for — and we will handle your quote request, question, or
        job application directly, at no disadvantage to you. You do not have to
        get the website to work in order to do business with us.
      </blockquote>

      <h2>Ongoing Work</h2>
      <p>
        Accessibility is not a one-time project for us. We re-run our automated
        checks as we change the site, we are working through the manual
        screen-reader testing described above, and we will update this page —
        including the known-gaps list — as issues are found and fixed.
      </p>

      <h2>Contact</h2>
      <p>
        Next Level Epoxy Flooring — Albuquerque, Santa Fe &amp; Rio Rancho, NM<br />
        Phone: <a href="tel:5053524674">505-352-4674</a><br />
        Email: <a href="mailto:nextlevelepoxycoatings@gmail.com">nextlevelepoxycoatings@gmail.com</a>
      </p>

      <p>
        See also our <Link href="/privacy">Privacy Policy</Link> and{' '}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalLayout>
  </>
);

export default Accessibility;
