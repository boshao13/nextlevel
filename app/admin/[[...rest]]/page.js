// app/admin/[[...rest]]/page.js
// Optional catch-all: /admin, /admin/login, /admin/leads/42, … all serve this
// one shell page; react-router inside AdminApp takes over in the browser.
// The server contributes only noindex metadata + the loading placeholder.
// (nginx's X-Robots-Tag map for /admin stays as belt-and-suspenders.)
import AdminClientOnly from '../../../src/admin/AdminClientOnly';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClientOnly />;
}
