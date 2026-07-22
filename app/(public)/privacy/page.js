import Privacy from '../../../src/Privacy';
import { pageMetadata } from '../../../src/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy | Next Level Epoxy Flooring',
  description: 'How Next Level Epoxy Flooring collects, uses, and protects your information when you request a quote or browse nextlevelepoxynm.com.',
  ogDescription: 'How Next Level Epoxy Flooring collects, uses, and protects your information.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return <Privacy />;
}
