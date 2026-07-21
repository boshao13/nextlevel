import StyledComponentsRegistry from '../lib/StyledComponentsRegistry';
import GlobalStyle from '../src/GlobalStyle';
import { GTAG_SNIPPET } from '../src/gtagSnippet';
import { BUSINESS_GRAPH, jsonLdString } from '../src/structuredData';

export const metadata = {
  metadataBase: new URL('https://www.nextlevelepoxynm.com'),
  // Base title (public/index.html:39). Pages override with absolute titles —
  // deliberately NOT a title template.
  title: 'Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy',
  // Site-wide keywords/author (public/index.html:18-22). No base description
  // exists today — do not add one.
  keywords:
    'epoxy flooring Albuquerque, epoxy flooring Santa Fe, epoxy flooring Rio Rancho, garage floor coating Albuquerque, concrete coatings New Mexico, polyaspartic flooring NM, commercial epoxy Albuquerque, residential epoxy Santa Fe',
  authors: [{ name: 'Next Level Epoxy Flooring' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/favicon-192.png', sizes: '192x192' }],
  },
  // Site-wide social card (public/index.html:27-36). Next metadata merging is
  // SHALLOW: any page exporting its own `openGraph`/`twitter` replaces these
  // objects entirely — src/seo.js (Task 9) re-states these exact fields on
  // every page that sets og:title/description/url. Pages with no openGraph
  // export (/thank-you, /snake, 404) inherit them from here. Keep this block
  // and src/seo.js's OG_DEFAULTS in sync.
  openGraph: {
    siteName: 'Next Level Epoxy Flooring',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.nextlevelepoxynm.com/images/og-image.jpg',
        type: 'image/jpeg',
        width: 1200,
        height: 630,
        alt: 'Next Level Epoxy Flooring — lifetime-warranty epoxy floors in Albuquerque, Santa Fe & Rio Rancho, NM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.nextlevelepoxynm.com/images/twitter-image.jpg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0e11',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Custom Fonts (public/index.html:110-117): preconnect + preload the
            H1/body weights so the font race isn't lost to the hero video; if
            Google bumps the font version these preloads become harmless
            no-ops and the stylesheet still wins. React 19 hoists the
            preconnect/preload links into <head> automatically; a
            <link rel="stylesheet"> is hoisted ONLY when it carries a
            `precedence` prop — hence precedence="default" below. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDD4Z1xlFd2JQEk.woff2"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
          precedence="default"
        />

        {/* Site-wide LocalBusiness + Service @graph (was public/index.html:42-105) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(BUSINESS_GRAPH) }}
        />

        <StyledComponentsRegistry>
          <GlobalStyle />
          {children}
        </StyledComponentsRegistry>

        {/* Parse-time GA4/Ads snippet (src/gtagSnippet.js) — inline so it
            executes before hydration, preserving pre-hydration bounce
            visibility exactly as the CRA site's head IIFE did. */}
        <script dangerouslySetInnerHTML={{ __html: GTAG_SNIPPET }} />
      </body>
    </html>
  );
}
