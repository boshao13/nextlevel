import Commercial from '../../../src/Commercial';
import { pageMetadata } from '../../../src/seo';

export const metadata = pageMetadata({
  title: 'Commercial Epoxy Flooring Albuquerque & Santa Fe NM | Next Level',
  description: 'Heavy-duty commercial epoxy & polyaspartic floor coatings for warehouses, restaurants, auto shops, and industrial facilities in NM. Lifetime warranty. 505-352-4674.',
  ogDescription: 'Heavy-duty commercial epoxy & polyaspartic floor coatings for warehouses, restaurants, auto shops, and industrial facilities in NM.',
  path: '/commercial',
});

export default function CommercialPage() {
  return <Commercial />;
}
