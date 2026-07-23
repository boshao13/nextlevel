'use client';
// src/admin/AdminClientOnly.jsx
// Thin client wrapper so the server page can mount AdminApp with ssr:false
// (Next 16 forbids ssr:false directly in server components). Skipping SSR
// keeps browser-only admin deps (BrowserRouter, the pdfjs worker pulled in
// by DocumentEditor → PdfPreview) from ever evaluating on the server.
import dynamic from 'next/dynamic';

const AdminApp = dynamic(() => import('./AdminApp'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '1rem',
        color: '#666',
      }}
    >
      Loading CRM…
    </div>
  ),
});

export default function AdminClientOnly() {
  return <AdminApp />;
}
