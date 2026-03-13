import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import Hero from "./Hero";
import EpoxyInfo from "./EpoxyInfo";
import FlakeCarousel from "./FlakeCarousel";
import ContactForm from "./ContactForm";
import Gallery from "./Gallery";
import Warranty from "./Warranty";
import GlobalStyle from "./GlobalStyle";
import Radon from "./Radon";
import GarageMakeover from "./GarageMakeover";
import ThankYou from './ThankYou';
// import Shop from "./Shop";
import Commercial from "./Commercial";
// import Classes from "./Classes";
import Snake from "./Snake";
import Careers from "./Careers";
// import Checkout from "./Checkout";
// import Confirmation from "./Confirmation";
// import Login from "./Login";
// import Dashboard from "./Dashboard"; // Import Dashboard component
// import ProtectedRoute from "./ProtectedRoute"; // Import ProtectedRoute component

// Styled layout container
const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures it takes up the full viewport height */
`;

const MainContent = styled.main`
  flex: 1; /* Ensures the main content stretches to fill available space */
`;

function App() {
  return (
    <Router>
      <GlobalStyle />
      <LayoutContainer>
        <Header />
        <MainContent>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Hero />
                    <EpoxyInfo />
                    <Warranty />
                    <FlakeCarousel />
                    <Gallery />
                    <ContactForm />
                  </>
                }
              />
              {/* <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              /> */}
              {/* <Route path="/confirmation" element={<Confirmation />} /> */}
              {/* <Route path="/shop" element={<Shop />} /> */}
              {/* <Route path="/checkout" element={<Checkout />} /> */}
              <Route path="/commercial" element={<Commercial />} />
              {/* <Route path="/classes" element={<Classes />} /> */}
              <Route path="/snake" element={<Snake />} />
              <Route path="/garagemakeover" element={<GarageMakeover />} />
              <Route path="/radon" element={<Radon />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="*" element={<h1>404 - Page Not Found</h1>} />
            </Routes>
          </Suspense>
        </MainContent>
        <Footer />
      </LayoutContainer>
    </Router>
  );
}

export default App;
