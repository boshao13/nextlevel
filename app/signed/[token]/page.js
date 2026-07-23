// app/signed/[token]/page.js — post-signature confirmation, same rules as /sign.
import SignedClient from '../../../src/public/SignedClient';

export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function SignedPage({ params }) {
  const { token } = await params;
  return <SignedClient token={token} />;
}
