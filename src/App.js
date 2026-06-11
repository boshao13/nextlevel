import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import Header from "./Header";
import Footer from "./Footer";
import Hero from "./Hero";
import EpoxyInfo from "./EpoxyInfo";
import FlakeCarousel from "./FlakeCarousel";
import ContactForm from "./ContactForm";
import Gallery from "./Gallery";
import Warranty from "./Warranty";
import Testimonials from "./Testimonials";
import GlobalStyle from "./GlobalStyle";
import Radon from "./Radon";
import GarageMakeover from "./GarageMakeover";
import ThankYou from './ThankYou';
import NotFound from './NotFound';
import Commercial from "./Commercial";
import Patios from "./Patios";
import Snake from "./Snake";
import Careers from "./Careers";
import StickyCallButton from "./StickyCallButton";
import LocationPage from "./LocationPage";
import PolishedConcreteDivision from "./PolishedConcreteDivision";
import { ALBUQUERQUE, SANTA_FE, RIO_RANCHO } from "./locations";
import { PourDivider, ResinSwirl } from "./accents";

// Admin imports
import Login from "./admin/Login";
import AdminRoute from "./admin/AdminRoute";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import Leads from "./admin/Leads";
import LeadDetail from "./admin/LeadDetail";
import Quotes from "./admin/Quotes";
import QuoteDetail from "./admin/QuoteDetail";
import Jobs from "./admin/Jobs";
import JobDetail from "./admin/JobDetail";
import Schedule from "./admin/Schedule";
import Invoices from "./admin/Invoices";
import InvoiceDetail from "./admin/InvoiceDetail";
import Finances from "./admin/Finances";
import Timesheet from "./admin/Timesheet";
import ApproveTimesheets from "./admin/ApproveTimesheets";
import Inventory from "./admin/Inventory";
import Payroll from "./admin/Payroll";
import PaySchedule from "./admin/PaySchedule";
import Documents from "./admin/Documents";
import DocumentEditor from "./admin/DocumentEditor";
import SignDocument from "./public/SignDocument";
import Signed from "./public/Signed";

// Code-split: the full Torginol catalog (500+ entries + swatch wiring) stays
// out of the main bundle; prerender still captures /colors (networkidle0
// waits for the chunk).
const AllColors = React.lazy(() => import("./AllColors"));

// Styled layout container
const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures it takes up the full viewport height */
`;

const MainContent = styled.main`
  flex: 1; /* Ensures the main content stretches to fill available space */
`;

const PublicLayout = () => (
  <LayoutContainer>
    <Header />
    <MainContent>
      <Outlet />
    </MainContent>
    <Footer />
    <StickyCallButton />
  </LayoutContainer>
);

function App() {
  return (
    <Router>
      <GlobalStyle />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Public routes with Header/Footer */}
          <Route element={<PublicLayout />}>
            <Route
              path="/"
              element={
                <>
                  <Helmet>
                    <title>Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy</title>
                    <meta name="description" content="Epoxy flooring in Albuquerque, Santa Fe & Rio Rancho NM. Lifetime garage floors & concrete coatings. 560+ installed. Free quote: 505-352-4674." />
                    <link rel="canonical" href="https://www.nextlevelepoxynm.com/" />
                    <meta property="og:title" content="Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level Epoxy" />
                    <meta property="og:description" content="Lifetime-warranty epoxy garage floors & concrete coatings in Albuquerque, Santa Fe & Rio Rancho NM. 560+ floors installed. Free quote: 505-352-4674." />
                    <meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg" />
                    <meta property="og:url" content="https://www.nextlevelepoxynm.com/" />
                    <meta property="og:type" content="website" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="Epoxy Flooring Albuquerque, Santa Fe & Rio Rancho NM | Next Level" />
                    <meta name="twitter:description" content="Lifetime-warranty epoxy garage floors & concrete coatings across New Mexico. 560+ floors installed. Free quote: 505-352-4674." />
                    <meta name="twitter:image" content="https://www.nextlevelepoxynm.com/images/twitter-image.jpg" />
                  </Helmet>
                  <Hero />
                  <PourDivider style={{ background: 'var(--bg0)' }} />
                  <EpoxyInfo />
                  <Warranty />
                  <ResinSwirl style={{ background: 'var(--bg0)' }} />
                  <FlakeCarousel />
                  <Gallery />
                  <Testimonials />
                  <ContactForm />
                </>
              }
            />
            <Route path="/commercial" element={<Commercial />} />
            <Route path="/snake" element={<Snake />} />
            <Route path="/garagemakeover" element={<GarageMakeover />} />
            {/* Catch any old links pointing at the hyphenated URL */}
            <Route path="/garage-makeover" element={<Navigate to="/garagemakeover" replace />} />
            <Route path="/patios" element={<Patios />} />
            <Route path="/radon" element={<Radon />} />
            <Route path="/colors" element={<AllColors />} />
            <Route path="/polished-concrete" element={<PolishedConcreteDivision />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/epoxy-flooring-albuquerque" element={<LocationPage city={ALBUQUERQUE} />} />
            <Route path="/epoxy-flooring-santa-fe"   element={<LocationPage city={SANTA_FE} />} />
            <Route path="/epoxy-flooring-rio-rancho" element={<LocationPage city={RIO_RANCHO} />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Public signer flow — no admin or public site layout */}
          <Route path="/sign/:token" element={<SignDocument />} />
          <Route path="/signed/:token" element={<Signed />} />

          {/* Admin routes - no public header/footer */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/new" element={<QuoteDetail />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="finances" element={<Finances />} />
            <Route path="timesheet" element={<Timesheet />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="pay-schedule" element={<PaySchedule />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="documents" element={<Documents />} />
            <Route path="documents/:id" element={<DocumentEditor />} />
            <Route path="approve" element={<ApproveTimesheets />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
