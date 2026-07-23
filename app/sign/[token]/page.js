// app/sign/[token]/page.js
// Customer e-sign flow — OUTSIDE the (public) group: no marketing chrome,
// matching the bare rendering the CRA app gave /sign/:token. The URL token is
// the credential, so: noindex + never send a Referer header (referrer
// metadata replaces the old react-helmet tag). nginx's /sign SPA-fallback
// special-case becomes obsolete at cutover (dropped in Task 24).
import SignDocumentClient from '../../../src/public/SignDocumentClient';

export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function SignPage({ params }) {
  const { token } = await params; // Next 16: params is async
  return <SignDocumentClient token={token} />;
}
