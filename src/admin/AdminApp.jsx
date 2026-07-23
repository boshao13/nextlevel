'use client';
// src/admin/AdminApp.jsx
// The entire CRM admin SPA, routes copied verbatim from the CRA src/App.js
// (lines 146-168). react-router-dom keeps running INSIDE Next's
// /admin/[[...rest]] catch-all: Next serves one shell page and BrowserRouter
// owns everything under /admin, so AdminRoute (JWT in localStorage),
// AdminLayout (NavLink/Outlet) and all 19 subroutes work unchanged.
// Mounted client-only via AdminClientOnly.jsx.
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminRoute from './AdminRoute';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import Leads from './Leads';
import LeadDetail from './LeadDetail';
import Quotes from './Quotes';
import QuoteDetail from './QuoteDetail';
import Jobs from './Jobs';
import JobDetail from './JobDetail';
import Schedule from './Schedule';
import Invoices from './Invoices';
import InvoiceDetail from './InvoiceDetail';
import Finances from './Finances';
import Timesheet from './Timesheet';
import ApproveTimesheets from './ApproveTimesheets';
import Inventory from './Inventory';
import Payroll from './Payroll';
import PaySchedule from './PaySchedule';
import Documents from './Documents';
import DocumentEditor from './DocumentEditor';

export default function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
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
    </BrowserRouter>
  );
}
