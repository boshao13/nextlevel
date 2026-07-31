import Accessibility from '../../../src/Accessibility';
import { pageMetadata } from '../../../src/seo';

export const metadata = pageMetadata({
  title: 'Accessibility Statement | Next Level Epoxy Flooring',
  description: 'Next Level Epoxy Flooring\'s accessibility statement for nextlevelepoxynm.com — our WCAG 2.1 Level AA target, partial conformance status, known gaps, and how to reach us for help.',
  ogDescription: 'Our WCAG 2.1 Level AA target, partial conformance status, known gaps, and how to get help.',
  path: '/accessibility',
});

export default function AccessibilityPage() {
  return <Accessibility />;
}
