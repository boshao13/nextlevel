import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
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
import Commercial from "./Commercial";
import Snake from "./Snake";
import Careers from "./Careers";
import AllColors from "./AllColors";

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
                  <Hero />
                  <EpoxyInfo />
                  <Warranty />
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
            <Route path="/radon" element={<Radon />} />
            <Route path="/colors" element={<AllColors />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Route>

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
            <Route path="approve" element={<ApproveTimesheets />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
