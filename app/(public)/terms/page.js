import Terms from '../../../src/Terms';
import { pageMetadata } from '../../../src/seo';

export const metadata = pageMetadata({
  title: 'Terms of Service | Next Level Epoxy Flooring',
  description: "Terms of service for nextlevelepoxynm.com and Next Level Epoxy Flooring's epoxy and concrete coating services in New Mexico.",
  ogDescription: "Terms of service for nextlevelepoxynm.com and Next Level Epoxy Flooring's New Mexico coating services.",
  path: '/terms',
});

export default function TermsPage() {
  return <Terms />;
}
