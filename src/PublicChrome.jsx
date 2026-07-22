'use client';

// Port of PublicLayout (src/App.js:62-81): the public marketing chrome.
// Used by app/(public)/layout.js AND app/not-found.js (the branded 404 keeps
// Header/Footer, matching today's PublicLayout-wrapped catch-all route).

import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Footer from './Footer';
import StickyCallButton from './StickyCallButton';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures it takes up the full viewport height */
`;

const MainContent = styled.main`
  flex: 1; /* Ensures the main content stretches to fill available space */
`;

const PublicChrome = ({ children }) => (
  <LayoutContainer>
    <Header />
    <MainContent>{children}</MainContent>
    <Footer />
    <StickyCallButton />
  </LayoutContainer>
);

export default PublicChrome;
