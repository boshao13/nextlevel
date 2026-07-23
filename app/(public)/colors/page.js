import dynamic from 'next/dynamic';
import { pageMetadata } from '../../../src/seo';

// Code-split: the full Torginol catalog (500+ entries + swatch wiring)
// stays out of the shared bundle — same intent as the old React.lazy split.
const AllColors = dynamic(() => import('../../../src/AllColors'), {
  loading: () => <div>Loading...</div>,
});

export const metadata = pageMetadata({
  title: 'Epoxy & Polyaspartic Floor Colors | Custom Flake Systems NM',
  description: 'Browse epoxy and polyaspartic floor color options for garages, basements, and commercial spaces in Albuquerque, Santa Fe, and Rio Rancho NM. Custom flake systems.',
  ogDescription: 'Browse epoxy and polyaspartic floor color options for garages, basements, and commercial spaces in NM.',
  path: '/colors',
});

export default function ColorsPage() {
  return <AllColors />;
}
