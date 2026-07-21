'use client';

// Port of PublicLayout (src/App.js:62-81): the public marketing chrome.
// Used by app/(public)/layout.js AND app/not-found.js (the branded 404 keeps
// Header/Footer, matching today's PublicLayout-wrapped catch-all route).
// Task 8 wires in Header / Footer / StickyCallButton once they are ported
// off react-router.

import React from 'react';
import styled from 'styled-components';

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
    {/* Task 8: <Header /> */}
    <MainContent>{children}</MainContent>
    {/* Task 8: <Footer /> and <StickyCallButton /> */}
  </LayoutContainer>
);

export default PublicChrome;
