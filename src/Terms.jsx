import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import LegalLayout from './components/LegalLayout';

const Terms = () => (
  <>
    <Helmet>
      <title>Terms of Service | Next Level Epoxy Flooring</title>
      <meta name="description" content="Terms of service for nextlevelepoxynm.com and Next Level Epoxy Flooring's epoxy and concrete coating services in New Mexico." />
      <link rel="canonical" href="https://www.nextlevelepoxynm.com/terms" />
      <meta property="og:title" content="Terms of Service | Next Level Epoxy Flooring" />
      <meta property="og:url" content="https://www.nextlevelepoxynm.com/terms" />
    </Helmet>
    <LegalLayout title="Terms of Service" effectiveDate="June 11, 2026">
      <p>
        Welcome to nextlevelepoxynm.com, operated by Next Level Epoxy Flooring ("we,"
        "us"). By using this website you agree to these terms. If you don't agree,
        please don't use the site.
      </p>

      <h2>Quotes &amp; Estimates</h2>
      <p>
        Information on this site — including example projects, photos, and videos — is
        provided for general guidance. Any figure discussed online or by phone is a
        preliminary estimate. Final pricing, scope, materials, and schedule are set
        out in the written quote or service agreement you receive from us, which
        controls if anything on this site differs from it.
      </p>

      <h2>Warranty Scope</h2>
      <p>Our lifetime warranty is described on this site and in your service agreement. In summary:</p>
      <blockquote>
        The warranty applies only to <strong>indoor concrete floors</strong> that Next
        Level has prepared and installed. Material defects and installation errors on
        those surfaces are covered 100%. Application on wood, tile, experimental, or
        otherwise unapproved substrates is not covered, and Next Level is not
        responsible for coating failure on surfaces we did not prepare.
      </blockquote>

      <h2>Slip Resistance</h2>
      <blockquote>
        Our standard epoxy coatings are <strong>not</strong> slip-resistant or
        anti-slip. Epoxy surfaces can become slippery when wet. A slip-resistant
        additive is available as an optional upgrade and must be specifically
        purchased and documented on your quote. Unless you have purchased and received
        a product explicitly sold with a slip-resistant guarantee, no anti-slip claim
        is being made and Next Level is not liable for slip-related incidents.
      </blockquote>

      <h2>Site Content</h2>
      <p>
        The content on this site — text, photos, videos, and graphics — belongs to
        Next Level Epoxy Flooring or is used with permission. Please don't copy or
        reuse it commercially without asking us first. Flake color names and swatch
        imagery reference products of their respective manufacturers.
      </p>

      <h2>Acceptable Use</h2>
      <p>
        Don't misuse the site: no attempts to disrupt it, probe or breach its
        security, submit forms with false information, or harvest data from it.
      </p>

      <h2>Third-Party Links</h2>
      <p>
        The site links to third-party services (for example Instagram and partner
        websites). We're not responsible for their content or privacy practices.
      </p>

      <h2>Disclaimer &amp; Limitation of Liability</h2>
      <p>
        The website itself is provided "as is" without warranties of any kind. To the
        fullest extent permitted by New Mexico law, we are not liable for indirect,
        incidental, or consequential damages arising from your use of the website.
        Nothing in these terms limits the service warranty described in your signed
        agreement or any rights you have under applicable law.
      </p>

      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of the State of New Mexico.</p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time; the current version will always
        be posted here with its effective date.
      </p>

      <h2>Contact</h2>
      <p>
        Next Level Epoxy Flooring — Albuquerque, Santa Fe &amp; Rio Rancho, NM<br />
        Phone: <a href="tel:5053524674">505-352-4674</a><br />
        Email: <a href="mailto:nextlevelepoxycoatings@gmail.com">nextlevelepoxycoatings@gmail.com</a>
      </p>

      <p>
        See also our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalLayout>
  </>
);

export default Terms;
